import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Box,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Description as ExportIcon,
  OpenInNew as ContinueIcon,
} from '@mui/icons-material';
import type { Session } from '../../types/session';
import { getIndustryLabel, getIndustryIcon } from '../../constants/industries';

interface HistoryTableProps {
  sessions: Session[];
  onView: (session: Session) => void;
  onExport: (session: Session) => void;
  onContinue: (session: Session) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({
  sessions,
  onView,
  onExport,
  onContinue,
}) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>时间</TableCell>
            <TableCell>行业</TableCell>
            <TableCell>数据文件</TableCell>
            <TableCell>分析问题</TableCell>
            <TableCell align="center">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.session_id} hover>
              <TableCell>{formatDate(session.created_at)}</TableCell>
              <TableCell>
                {session.industry ? (
                  <Chip
                    size="small"
                    label={`${getIndustryIcon(session.industry)} ${getIndustryLabel(session.industry)}`}
                  />
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{session.file_name}</TableCell>
              <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {session.first_query}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  <Tooltip title="查看详情">
                    <IconButton size="small" onClick={() => onView(session)}>
                      <ViewIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="导出报告">
                    <IconButton size="small" onClick={() => onExport(session)}>
                      <ExportIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="继续分析">
                    <IconButton size="small" color="primary" onClick={() => onContinue(session)}>
                      <ContinueIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default HistoryTable;
