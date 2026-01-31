import React from 'react';
import { Box, Typography } from '@mui/material';
import { Speed as SpeedIcon } from '@mui/icons-material';

const CapabilityPage: React.FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
        color: '#80cbc4',
      }}
    >
      <SpeedIcon sx={{ fontSize: 64, color: '#00e676', opacity: 0.6 }} />
      <Typography variant="h5" sx={{ color: '#e0f2f1', fontWeight: 600 }}>
        流程能力分析
      </Typography>
      <Typography variant="body1" sx={{ textAlign: 'center', maxWidth: 420 }}>
        Cp, Cpk, Pp, Ppk 等流程能力指标计算与评估
      </Typography>
      <Box
        sx={{
          mt: 2,
          px: 3,
          py: 1.5,
          borderRadius: 2,
          border: '1px solid rgba(0, 230, 118, 0.25)',
          bgcolor: 'rgba(0, 230, 118, 0.05)',
        }}
      >
        <Typography variant="body2" sx={{ color: '#00e676' }}>
          功能即将上线，敬请期待
        </Typography>
      </Box>
    </Box>
  );
};

export default CapabilityPage;
