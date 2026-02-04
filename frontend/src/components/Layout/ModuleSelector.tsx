import React from 'react';
import { Box, ButtonBase, Typography } from '@mui/material';
import {
  Science as ScienceIcon,
  Speed as SpeedIcon,
  Insights as InsightsIcon,
} from '@mui/icons-material';
import { useAppStore, type ModuleType } from '../../store/appStore';

const modules: { key: ModuleType; label: string; icon: React.ReactElement }[] = [
  { key: 'hypothesis', label: '影响因子分析', icon: <ScienceIcon fontSize="small" /> },
  { key: 'spc', label: 'SPC/稳定性分析', icon: <InsightsIcon fontSize="small" /> },
  { key: 'capability', label: '流程能力CP/CPK', icon: <SpeedIcon fontSize="small" /> },
];

interface ModuleSelectorProps {
  onHypothesisClick?: () => void;
  onSpcClick?: () => void;
  onCapabilityClick?: () => void;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({ onHypothesisClick, onSpcClick, onCapabilityClick }) => {
  const { activeModule, setActiveModule } = useAppStore();

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        p: 2,
      }}
    >
      {modules.map((mod) => {
        const isActive = activeModule === mod.key;
        return (
          <ButtonBase
            key={mod.key}
            onClick={() => {
              setActiveModule(mod.key);
              if (mod.key === 'hypothesis' && onHypothesisClick) {
                onHypothesisClick();
              }
              if (mod.key === 'spc' && onSpcClick) {
                onSpcClick();
              }
              if (mod.key === 'capability' && onCapabilityClick) {
                onCapabilityClick();
              }
            }}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              py: 1.2,
              px: 1,
              borderRadius: 1.5,
              ...(mod.key === 'capability' && { gridColumn: 'span 2' }),
              border: isActive
                ? '1.5px solid #00e676'
                : '1px solid rgba(128, 203, 196, 0.25)',
              bgcolor: isActive
                ? 'rgba(0, 230, 118, 0.10)'
                : 'rgba(255, 255, 255, 0.03)',
              color: isActive ? '#00e676' : '#80cbc4',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: isActive
                  ? 'rgba(0, 230, 118, 0.15)'
                  : 'rgba(128, 203, 196, 0.08)',
                borderColor: isActive ? '#00e676' : 'rgba(128, 203, 196, 0.4)',
              },
            }}
          >
            {React.cloneElement(mod.icon as React.ReactElement<any>, { sx: { color: '#00e676' } })}
            <Typography
              variant="caption"
              sx={{
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.72rem',
                lineHeight: 1.2,
              }}
            >
              {mod.label}
            </Typography>
          </ButtonBase>
        );
      })}
    </Box>
  );
};

export default ModuleSelector;
