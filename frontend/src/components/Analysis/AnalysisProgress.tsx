import React from 'react';
import { Box, Stepper, Step, StepLabel } from '@mui/material';

const STEP_LABELS = [
  '数据识别',
  '前提校验',
  '方法选择',
  '统计计算',
  '效应量',
  '结论建议',
];

interface AnalysisProgressProps {
  activeStep: number; // 0-5 during analysis, 6 = all complete
  isLoading?: boolean;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ activeStep, isLoading }) => {
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
        {STEP_LABELS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default AnalysisProgress;
