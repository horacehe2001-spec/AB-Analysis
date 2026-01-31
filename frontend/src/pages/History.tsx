import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Pagination,
  Typography,
} from '@mui/material';
import Layout from '../components/Layout/Layout';
import SearchFilters from '../components/History/SearchFilters';
import HistoryTable from '../components/History/HistoryTable';
import { useSessionStore } from '../store/sessionStore';
import { useChatStore } from '../store/chatStore';
import { sessionsApi } from '../api/sessions';
import type { Session, SessionsQuery } from '../types/session';
import { exportApi } from '../api/export';

const History: React.FC = () => {
  const navigate = useNavigate();
  const { sessions, total, isLoading, error, fetchSessions, setCurrentFile, setIndustry } = useSessionStore();
  const { setSessionId, addMessage, clearMessages, setConclusion } = useChatStore();

  const [filters, setFilters] = useState<SessionsQuery>({ page: 1, size: 10 });
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  const normalizeFilters = (q: SessionsQuery): SessionsQuery => {
    const size = q.size || 10;
    const page = q.page || 1;
    const out: SessionsQuery = { ...q, page, size };

    const timeToken = out.start_date;
    if (timeToken && ['today', '7days', '30days'].includes(timeToken)) {
      const now = new Date();
      const start = new Date(now);
      if (timeToken === 'today') start.setDate(now.getDate());
      if (timeToken === '7days') start.setDate(now.getDate() - 7);
      if (timeToken === '30days') start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      out.start_date = start.toISOString();
      out.end_date = now.toISOString();
    }

    return out;
  };

  useEffect(() => {
    fetchSessions(normalizeFilters(filters));
  }, []);

  const handleSearch = () => {
    fetchSessions(normalizeFilters({ ...filters, page: 1 }));
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchSessions(normalizeFilters(newFilters));
  };

  const handleView = async (session: Session) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailError(null);
      const detail = await sessionsApi.getSessionDetail(session.session_id);
      setSelectedDetail(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : '获取详情失败');
    }
    finally {
      setDetailLoading(false);
    }
  };

  const handleExportById = async (sessionId: string) => {
    try {
      const detail = await sessionsApi.getSessionDetail(sessionId);
      if (!detail.report_conclusion) {
        const analyses = (detail.messages || [])
          .filter((m: any) => m.analysis)
          .map((m: any) => ({
            method: m.analysis.method,
            method_name: m.analysis.method_name,
            p_value: m.analysis.p_value,
            significant: m.analysis.significant,
            effect_size: m.analysis.effect_size as Record<string, unknown>,
            interpretation: m.analysis.interpretation,
            suggestions: m.analysis.suggestions || [],
          }));
        if (!analyses.length) {
          alert('该会话没有可导出的分析结果');
          return;
        }
        const conclusionResp = await exportApi.generateConclusion({
          session_id: sessionId,
          analyses,
          data_summary: detail.data_summary as unknown as Record<string, unknown>,
        });
        detail.report_conclusion = conclusionResp.conclusion;
      }

      const response = await exportApi.exportReport({
        session_id: sessionId,
        format: 'md',
        include_charts: true,
      });
      exportApi.downloadReport(response.download_url, response.file_name);
    } catch (err) {
      alert('导出失败');
    }
  };

  const handleExport = async (session: Session) => {
    await handleExportById(session.session_id);
  };

  const handleContinue = async (session: Session) => {
    try {
      const detail = await sessionsApi.getSessionDetail(session.session_id);
      setDetailOpen(false);
      setSelectedDetail(null);

      clearMessages();
      setSessionId(detail.session_id);
      setCurrentFile(detail.file_name, detail.data_summary);
      setIndustry(detail.industry || null);
      setConclusion(detail.report_conclusion || null);

      detail.messages.forEach((msg) => addMessage(msg));

      navigate('/');
    } catch (err) {
      alert('恢复会话失败');
    }
  };

  const continueFromDetail = () => {
    if (!selectedDetail) return;
    clearMessages();
    setSessionId(selectedDetail.session_id);
    setCurrentFile(selectedDetail.file_name, selectedDetail.data_summary);
    setIndustry(selectedDetail.industry || null);
    setConclusion(selectedDetail.report_conclusion || null);
    selectedDetail.messages.forEach((msg: any) => addMessage(msg));
    setDetailOpen(false);
    setSelectedDetail(null);
    navigate('/');
  };

  const totalPages = Math.ceil(total / (filters.size || 10));

  return (
    <Layout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h5">历史记录</Typography>

        <SearchFilters filters={filters} onChange={setFilters} onSearch={handleSearch} />

        {error && <Alert severity="error">{error}</Alert>}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <HistoryTable
              sessions={sessions}
              onView={handleView}
              onExport={handleExport}
              onContinue={handleContinue}
            />

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={filters.page || 1}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" align="center">
              共 {total} 条记录
            </Typography>
          </>
        )}

        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>会话详情</DialogTitle>
          <DialogContent dividers>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : detailError ? (
              <Alert severity="error">{detailError}</Alert>
            ) : selectedDetail ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    数据文件：{selectedDetail.file_name || '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    行业：{selectedDetail.industry || '-'}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {selectedDetail.messages.map((m: any) => (
                    <Box key={m.id} sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {m.role === 'user' ? '用户' : '助手'} ·{' '}
                        {m.timestamp instanceof Date ? m.timestamp.toLocaleString() : String(m.timestamp)}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                        {m.content}
                      </Typography>
                      {m.analysis && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          方法：{m.analysis.method_name || m.analysis.method}，p={m.analysis.p_value}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                请选择一条会话查看。
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            {selectedDetail && (
              <Button variant="outlined" onClick={() => handleExportById(selectedDetail.session_id)}>
                导出 Markdown
              </Button>
            )}
            <Button onClick={() => setDetailOpen(false)}>关闭</Button>
            {selectedDetail && (
              <Button variant="contained" onClick={continueFromDetail}>
                继续分析
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default History;
