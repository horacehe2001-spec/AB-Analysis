import React from 'react';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import type { Message } from '../../types/chat';

interface UserMessageProps {
  message: Message;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
      <Paper
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: 'rgba(0, 230, 118, 0.15)',
          border: '1px solid rgba(0, 230, 118, 0.25)',
          color: '#e0f2f1',
          borderRadius: '16px 16px 4px 16px',
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
      </Paper>
      <Avatar sx={{ ml: 1, bgcolor: 'rgba(0, 230, 118, 0.2)', color: '#00e676' }}>
        <PersonIcon />
      </Avatar>
    </Box>
  );
};

export default UserMessage;
