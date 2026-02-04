import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, List, ListItemButton, ListItemText, Divider, Chip } from '@mui/material';
import { History as HistoryIcon } from '@mui/icons-material';
import FileUpload from '../Upload/FileUpload';
import DataPreview from '../Upload/DataPreview';
import ChatInput from '../Chat/ChatInput';
import ModuleSelector from './ModuleSelector';
import VariablePickerDialog, { type PickerMode } from '../Analysis/VariablePickerDialog';
import { useSessionStore } from '../../store/sessionStore';
import { useChatStore } from '../../store/chatStore';
import { chatApi } from '../../api/chat';

const Sidebar: React.FC = () => {
  const { currentFile, dataSummary, sessions, fetchSessions } = useSessionStore();
  const { sendMessage, isLoading, setSessionId } = useChatStore();
  const { clearCurrent } = useSessionStore();
  const { clearMessages } = useChatStore();
  const [variablePickerOpen, setVariablePickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>('hypothesis');

  useEffect(() => {
    fetchSessions({ page: 1, size: 5 });
  }, []);

  const handleSessionClick = (sessionId: string) => {
    clearMessages();
    clearCurrent();
    setSessionId(sessionId);
  };

  const handleHypothesisClick = useCallback(() => {
    if (dataSummary) {
      setPickerMode('hypothesis');
      setVariablePickerOpen(true);
    }
  }, [dataSummary]);

  const handleSpcClick = useCallback(() => {
    if (dataSummary) {
      setPickerMode('spc');
      setVariablePickerOpen(true);
    }
  }, [dataSummary]);

  const handleCapabilityClick = useCallback(() => {
    if (dataSummary) {
      setPickerMode('capability');
      setVariablePickerOpen(true);
    }
  }, [dataSummary]);

  const handleVariableConfirm = useCallback(async (yVariable: string, xVariables: string[], specLimits?: { usl: number; lsl: number }) => {
    setVariablePickerOpen(false);
    const currentMode = pickerMode;
    const { sessionId, addMessage, addMultiAnalysisResult, clearMultiAnalysisResults, setError } = useChatStore.getState();

    if (currentMode === 'capability') {
      const userMsg = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: `流程能力分析：Y = ${yVariable}，USL = ${specLimits?.usl}，LSL = ${specLimits?.lsl}`,
        timestamp: new Date(),
      };
      addMessage(userMsg);

      try {
        const jsonMsg = JSON.stringify({ task: 'capability', y: yVariable, usl: specLimits?.usl, lsl: specLimits?.lsl });
        const response = await chatApi.sendMessage({
          session_id: sessionId || undefined,
          message: jsonMsg,
        });

        if (!sessionId && response.session_id) {
          useChatStore.getState().setSessionId(response.session_id);
        }

        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: response.reply,
          timestamp: new Date(),
          analysis: response.analysis,
        };
        addMessage(aiMsg);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '流程能力分析失败';
        setError(errorMessage);
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: `分析出错: ${errorMessage}`,
          timestamp: new Date(),
        });
      }
      return;
    }

    if (currentMode === 'spc') {
      // SPC mode: single Y variable, send as spc task
      const userMsg = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: `SPC 分析：Y = ${yVariable}`,
        timestamp: new Date(),
      };
      addMessage(userMsg);

      try {
        const jsonMsg = JSON.stringify({ task: 'spc', y: yVariable });
        const response = await chatApi.sendMessage({
          session_id: sessionId || undefined,
          message: jsonMsg,
        });

        if (!sessionId && response.session_id) {
          useChatStore.getState().setSessionId(response.session_id);
        }

        const aiMsg = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: response.reply,
          timestamp: new Date(),
          analysis: response.analysis,
        };
        addMessage(aiMsg);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'SPC 分析失败';
        setError(errorMessage);
        addMessage({
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: `分析出错: ${errorMessage}`,
          timestamp: new Date(),
        });
      }
      return;
    }

    // Hypothesis mode: Y + multiple X variables
    const userMsg = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: `影响因子分析：Y = ${yVariable}，X = ${xVariables.join(', ')}`,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    clearMultiAnalysisResults();

    for (const xVar of xVariables) {
      try {
        const jsonMsg = JSON.stringify({ task: 'auto', x: xVar, y: yVariable });
        const response = await chatApi.sendMessage({
          session_id: sessionId || undefined,
          message: jsonMsg,
        });

        if (!sessionId && response.session_id) {
          useChatStore.getState().setSessionId(response.session_id);
        }

        if (response.analysis) {
          addMultiAnalysisResult({
            xVariable: xVar,
            yVariable,
            analysis: response.analysis,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `分析 ${xVar} 失败`;
        setError(errorMessage);
      }
    }

    const results = useChatStore.getState().multiAnalysisResults;
    const summaryParts = results.map(
      (r) => `${r.xVariable} → ${r.yVariable}: p=${r.analysis.p_value.toFixed(4)}, ${r.analysis.significant ? '显著' : '不显著'}`
    );
    const aiMsg = {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: results.length > 0
        ? `完成 ${results.length} 项影响因子分析：\n${summaryParts.join('\n')}`
        : '分析未返回有效结果，请检查所选变量是否为数值类型。',
      timestamp: new Date(),
      analysis: results.length === 1 ? results[0].analysis : undefined,
    };
    addMessage(aiMsg);
  }, [pickerMode]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Module Selector */}
      <ModuleSelector onHypothesisClick={handleHypothesisClick} onSpcClick={handleSpcClick} onCapabilityClick={handleCapabilityClick} />

      <Divider />

      {/* File Upload / Data Preview */}
      <Box sx={{ p: 2, flexShrink: 0 }}>
        {!currentFile ? (
          <FileUpload />
        ) : (
          dataSummary && <DataPreview fileName={currentFile} summary={dataSummary} />
        )}
      </Box>

      <Divider />

      {/* Chat Input */}
      <Box sx={{ p: 2, flexShrink: 0 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, color: '#00e676', fontWeight: 600, letterSpacing: '0.05em' }}>
          分析提问
        </Typography>
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading || !currentFile}
          placeholder={currentFile ? '请描述您的分析需求…' : '请先上传数据文件'}
        />
      </Box>

      <Divider />

      {/* Recent Sessions */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.5 }}>
          <HistoryIcon fontSize="small" sx={{ color: '#00e676' }} />
          <Typography variant="subtitle2" sx={{ color: '#80cbc4' }}>
            最近分析
          </Typography>
        </Box>
        <List dense disablePadding>
          {sessions.slice(0, 5).map((session) => (
            <ListItemButton
              key={session.session_id}
              onClick={() => handleSessionClick(session.session_id)}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              <ListItemText
                primary={session.first_query || session.file_name}
                secondary={
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                    {session.methods_used.slice(0, 2).map((m) => (
                      <Chip key={m} label={m} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                }
                primaryTypographyProps={{
                  variant: 'body2',
                  noWrap: true,
                  sx: { color: '#e0f2f1' },
                }}
              />
            </ListItemButton>
          ))}
          {sessions.length === 0 && (
            <Typography variant="body2" sx={{ px: 2, py: 1, color: '#80cbc4' }}>
              暂无历史记录
            </Typography>
          )}
        </List>
      </Box>
      {/* Variable Picker Dialog */}
      <VariablePickerDialog
        open={variablePickerOpen}
        onClose={() => setVariablePickerOpen(false)}
        columns={dataSummary?.column_names ?? []}
        onConfirm={handleVariableConfirm}
        mode={pickerMode}
        columnStats={dataSummary?.column_stats}
      />
    </Box>
  );
};

export default Sidebar;
