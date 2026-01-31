import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  AutoAwesome as AiIcon,
  Description as ReportIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';

interface ConclusionPanelProps {
  conclusion: string | null;
  isLoading: boolean;
  onGenerate: () => void;
}

const ConclusionPanel: React.FC<ConclusionPanelProps> = ({
  conclusion,
  isLoading,
  onGenerate,
}) => {
  return (
    <Box sx={{ mt: 3 }}>
      {/* Header + Regenerate Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ReportIcon sx={{ color: '#ffab40' }} />
          <Typography variant="h6" sx={{ color: '#e0f2f1', fontWeight: 600 }}>
            分析报告
          </Typography>
        </Box>
        {conclusion && (
          <Button
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <AiIcon />}
            onClick={onGenerate}
            disabled={isLoading}
            sx={{
              bgcolor: '#ffab40',
              color: '#0a1628',
              fontWeight: 600,
              '&:hover': { bgcolor: '#ff9100' },
              '&.Mui-disabled': {
                bgcolor: 'rgba(255, 171, 64, 0.3)',
                color: 'rgba(224, 242, 241, 0.4)',
              },
            }}
          >
            {isLoading ? '生成中...' : '重新生成'}
          </Button>
        )}
      </Box>

      {/* Conclusion content */}
      {isLoading && !conclusion && (
        <Paper
          sx={{
            p: 3,
            bgcolor: 'rgba(255, 171, 64, 0.05)',
            border: '1px solid rgba(255, 171, 64, 0.15)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            minHeight: 120,
          }}
        >
          <CircularProgress size={24} sx={{ color: '#ffab40' }} />
          <Typography sx={{ color: '#80cbc4' }}>
            AI 正在分析数据并生成报告结论...
          </Typography>
        </Paper>
      )}

      {conclusion && (
        <Paper
          sx={{
            p: 3,
            bgcolor: 'rgba(255, 171, 64, 0.05)',
            border: '1px solid rgba(255, 171, 64, 0.15)',
            borderRadius: 2,
            '& h1, & h2, & h3, & h4': {
              color: '#e0f2f1',
              mt: 2,
              mb: 1,
              '&:first-of-type': { mt: 0 },
            },
            '& p': {
              color: '#b0bec5',
              lineHeight: 1.8,
              mb: 1,
            },
            '& ul, & ol': {
              color: '#b0bec5',
              pl: 2.5,
              mb: 1,
            },
            '& li': {
              mb: 0.5,
            },
            '& strong': {
              color: '#e0f2f1',
            },
            '& code': {
              bgcolor: 'rgba(0, 230, 118, 0.1)',
              color: '#00e676',
              px: 0.5,
              borderRadius: 0.5,
              fontSize: '0.9em',
            },
          }}
        >
          <ReactMarkdown>{conclusion}</ReactMarkdown>
        </Paper>
      )}
    </Box>
  );
};

export default ConclusionPanel;
