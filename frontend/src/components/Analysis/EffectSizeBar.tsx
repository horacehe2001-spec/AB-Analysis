import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import type { EffectSize } from '../../types/chat';

// Threshold configs for different effect size types
const THRESHOLDS: Record<string, { small: number; medium: number; large: number; max: number }> = {
  cohens_d: { small: 0.2, medium: 0.5, large: 0.8, max: 1.5 },
  r_squared: { small: 0.01, medium: 0.06, large: 0.14, max: 0.5 },
  eta_squared: { small: 0.01, medium: 0.06, large: 0.14, max: 0.5 },
  cramers_v: { small: 0.1, medium: 0.3, large: 0.5, max: 1.0 },
};

const LEVEL_COLORS: Record<string, string> = {
  small: '#80cbc4',
  medium: '#ffab00',
  large: '#00e676',
};

const LEVEL_LABELS: Record<string, string> = {
  small: '小效应',
  medium: '中等效应',
  large: '大效应',
};

interface EffectSizeBarProps {
  effectSize: EffectSize;
}

const EffectSizeBar: React.FC<EffectSizeBarProps> = ({ effectSize }) => {
  const config = THRESHOLDS[effectSize.type] || THRESHOLDS.cohens_d;
  const percentage = Math.min((Math.abs(effectSize.value) / config.max) * 100, 100);
  const color = LEVEL_COLORS[effectSize.level] || LEVEL_COLORS.small;

  const typeName = effectSize.type.replace('_', ' ').toUpperCase();

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={600} sx={{ color: '#e0f2f1' }}>
          {typeName}: {Math.abs(effectSize.value).toFixed(3)}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color,
            fontWeight: 600,
            bgcolor: `${color}20`,
            px: 1,
            py: 0.25,
            borderRadius: 1,
          }}
        >
          {LEVEL_LABELS[effectSize.level]}
        </Typography>
      </Box>

      {/* Progress bar */}
      <Box sx={{ position: 'relative', height: 12, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 12,
            borderRadius: 6,
            bgcolor: 'rgba(0, 230, 118, 0.08)',
            '& .MuiLinearProgress-bar': {
              bgcolor: color,
              borderRadius: 6,
              transition: 'transform 0.8s ease-in-out',
              boxShadow: `0 0 8px ${color}66`,
            },
          }}
        />
      </Box>

      {/* Threshold markers */}
      <Box sx={{ position: 'relative', height: 20 }}>
        {(['small', 'medium', 'large'] as const).map((level) => {
          const pos = (config[level] / config.max) * 100;
          return (
            <Box
              key={level}
              sx={{
                position: 'absolute',
                left: `${pos}%`,
                transform: 'translateX(-50%)',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  width: 1,
                  height: 6,
                  bgcolor: 'rgba(0, 230, 118, 0.3)',
                  mx: 'auto',
                  mb: 0.25,
                }}
              />
              <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#80cbc4' }}>
                {config[level]}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default EffectSizeBar;
