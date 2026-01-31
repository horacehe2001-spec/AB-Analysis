import React from 'react';
import { Box, Paper } from '@mui/material';
import { useChatStore } from '../../store/chatStore';
import { useSessionStore } from '../../store/sessionStore';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const ChatContainer: React.FC = () => {
  const { messages, isLoading, sendMessage } = useChatStore();
  const { currentFile } = useSessionStore();
  const disabled = isLoading || !currentFile;

  return (
    <Paper sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '60vh',
      border: '1px solid rgba(0, 230, 118, 0.12)',
    }}>
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <MessageList messages={messages} isLoading={isLoading} />
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(0, 230, 118, 0.12)' }}>
        <ChatInput
          onSend={sendMessage}
          disabled={disabled}
          placeholder={currentFile ? '请描述您的分析需求…' : '请先上传数据文件'}
        />
      </Box>
    </Paper>
  );
};

export default ChatContainer;
