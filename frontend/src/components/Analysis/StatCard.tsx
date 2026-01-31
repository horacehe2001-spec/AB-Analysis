import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: number | string;
  type: 'pvalue' | 'effect' | 'significance';
  significant?: boolean;
  level?: 'small' | 'medium' | 'large';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, type, significant, level }) => {
  const getColor = () => {
    if (type === 'pvalue') {
      return significant ? '#00e676' : '#80cbc4';
    }
    if (type === 'effect') {
      if (level === 'large') return '#00e676';
      if (level === 'medium') return '#ffab00';
      return '#80cbc4';
    }
    return significant ? '#00e676' : '#80cbc4';
  };

  const formatValue = () => {
    if (typeof value === 'number') {
      return value < 0.001 ? '< 0.001' : value.toFixed(3);
    }
    return value;
  };

  return (
    <Card sx={{
      minWidth: 120,
      bgcolor: 'rgba(0, 230, 118, 0.04)',
      border: '1px solid rgba(0, 230, 118, 0.12)',
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="caption" sx={{ color: '#80cbc4' }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Typography variant="h5" sx={{ color: getColor(), fontWeight: 600 }}>
            {formatValue()}
          </Typography>
          {type === 'significance' && (
            significant ? (
              <CheckCircle sx={{ color: '#00e676' }} />
            ) : (
              <Cancel sx={{ color: '#546e7a' }} />
            )
          )}
        </Box>
        {level && (
          <Typography variant="caption" sx={{ color: '#80cbc4' }}>
            {level === 'large' ? '大效应' : level === 'medium' ? '中等效应' : '小效应'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
