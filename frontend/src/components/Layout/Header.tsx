import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
} from '@mui/material';
import {
  Home as HomeIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useSessionStore } from '../../store/sessionStore';
import { useChatStore } from '../../store/chatStore';
import { useAppStore } from '../../store/appStore';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleGoHome = () => {
    useSessionStore.getState().clearCurrent();
    useChatStore.getState().clearMessages();
    useAppStore.getState().setActiveModule('hypothesis');
    navigate('/');
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <AnalyticsIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              color: '#e0f2f1',
              letterSpacing: '0.02em',
            }}
          >
            流程智能洞察中心
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            startIcon={<HomeIcon sx={{ color: '#00e676' }} />}
            variant={isActive('/') ? 'contained' : 'outlined'}
            onClick={handleGoHome}
          >
            返回首页
          </Button>
          <Button
            startIcon={<HistoryIcon sx={{ color: '#00e676' }} />}
            variant={isActive('/history') ? 'contained' : 'outlined'}
            onClick={() => navigate('/history')}
          >
            历史记录
          </Button>
          <IconButton
            sx={{
              color: '#00e676',
            }}
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
