import React from 'react';
import { Box } from '@mui/material';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {sidebar && (
          <Box
            sx={{
              width: 360,
              minWidth: 360,
              borderRight: '1px solid rgba(0, 230, 118, 0.12)',
              bgcolor: '#0b1a30',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {sidebar}
          </Box>
        )}
        <Box
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
