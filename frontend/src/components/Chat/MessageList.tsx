import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import type { Message } from '../../types/chat';
import UserMessage from './UserMessage';
import AIMessage from './AIMessage';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
      >
        <Typography sx={{ color: '#80cbc4' }}>上传数据后开始分析对话</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {messages.map((message) =>
        message.role === 'user' ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AIMessage key={message.id} message={message} />
        )
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 6 }}>
          <CircularProgress size={20} sx={{ color: '#00e676' }} />
          <Typography variant="body2" sx={{ color: '#80cbc4' }}>
            正在分析...
          </Typography>
        </Box>
      )}

      <div ref={bottomRef} />
    </Box>
  );
};

export default MessageList;
