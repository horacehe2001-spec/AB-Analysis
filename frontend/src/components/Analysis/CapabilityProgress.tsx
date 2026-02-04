import React from 'react';
import { Box, Stepper, Step, StepLabel } from '@mui/material';

const CAPABILITY_STEP_LABELS = [
  '数据识别',
  '正态性检验',
  '指标计算',
  '能力评估',
  '结论建议',
];

interface CapabilityProgressProps {
  activeStep: number; // 0-4 during analysis, 5 = all complete
  isLoading?: boolean;
}

const CapabilityProgress: React.FC<CapabilityProgressProps> = ({ activeStep, isLoading }) => {
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          '& .MuiStepConnector-line': {
            transition: 'border-color 0.3s ease',
          },
          ...(isLoading && {
            '& .MuiStepIcon-root.Mui-active': {
              animation: 'pulse 1.5s ease-in-out infinite',
              filter: 'drop-shadow(0 0 6px rgba(0, 230, 118, 0.5))',
            },
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.4 },
            },
          }),
        }}
      >
        {CAPABILITY_STEP_LABELS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default CapabilityProgress;
