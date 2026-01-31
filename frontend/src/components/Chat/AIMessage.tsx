import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { SmartToy as AIIcon } from '@mui/icons-material';
import type { Message } from '../../types/chat';

interface AIMessageProps {
  message: Message;
}

const AIMessage: React.FC<AIMessageProps> = ({ message }) => {
  return (
    <Box sx={{ display: 'flex', mb: 2 }}>
      <Avatar sx={{ mr: 1, bgcolor: 'rgba(0, 230, 118, 0.15)', color: '#00e676' }}>
        <AIIcon />
      </Avatar>
      <Box sx={{ maxWidth: '85%' }}>
        <Paper
          sx={{
            p: 2,
            bgcolor: 'rgba(0, 230, 118, 0.06)',
            border: '1px solid rgba(0, 230, 118, 0.12)',
            borderRadius: '16px 16px 16px 4px',
          }}
        >
          <Typography
            variant="body1"
            sx={{ whiteSpace: 'pre-wrap', color: '#e0f2f1' }}
            dangerouslySetInnerHTML={{
              __html: message.content
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00e676">$1</strong>')
                .replace(/\n/g, '<br/>'),
            }}
          />
        </Paper>

        {message.analysis && (
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: '#80cbc4' }}>
            分析结果已显示在右侧面板
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default AIMessage;
