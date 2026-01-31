import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import type { AnalysisResult as AnalysisResultType } from '../../types/chat';
import StatCard from './StatCard';
import MethodBadge from './MethodBadge';
import Suggestions from './Suggestions';
import ChartContainer from '../Charts/ChartContainer';

interface AnalysisResultProps {
  result: AnalysisResultType;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          分析结果
        </Typography>
        <MethodBadge method={result.method} methodName={result.method_name} />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <StatCard
          title="p 值"
          value={result.p_value}
          type="pvalue"
          significant={result.significant}
        />
        <StatCard
          title={result.effect_size.type.replace('_', ' ').toUpperCase()}
          value={result.effect_size.value}
          type="effect"
          level={result.effect_size.level}
        />
        <StatCard
          title="显著性"
          value={result.significant ? '显著' : '不显著'}
          type="significance"
          significant={result.significant}
        />
      </Box>

      {result.visualizations && result.visualizations.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {result.visualizations.map((chart, index) => (
            <ChartContainer key={index} config={chart} />
          ))}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        业务解读
      </Typography>
      <Typography variant="body1">{result.interpretation}</Typography>

      <Suggestions suggestions={result.suggestions} />
    </Paper>
  );
};

export default AnalysisResult;
