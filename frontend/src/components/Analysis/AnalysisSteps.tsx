import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  DataObject as DataIcon,
  CheckCircleOutline as CheckIcon,
  AccountTree as TreeIcon,
  Calculate as CalcIcon,
  Speed as SpeedIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';
import type { AnalysisResult } from '../../types/chat';
import type { DataSummary } from '../../types/session';
import EffectSizeBar from './EffectSizeBar';
import StatCard from './StatCard';
import MethodBadge from './MethodBadge';
import Suggestions from './Suggestions';
import ChartContainer from '../Charts/ChartContainer';

interface AnalysisStepsProps {
  result: AnalysisResult;
  dataSummary: DataSummary | null;
}

// Map method to prerequisite description
const getPrerequisites = (method: string, rows: number): string[] => {
  const prerequisites: string[] = [`样本量: ${rows} 行`];
  const normalMethods = ['t_test', 'paired_t_test', 'anova', 'pearson'];
  if (normalMethods.some((m) => method.includes(m))) {
    prerequisites.push('前提假设: 数据近似正态分布');
    prerequisites.push('检验方式: 参数检验');
  } else {
    prerequisites.push('前提假设: 无分布假设要求');
    prerequisites.push('检验方式: 非参数检验');
  }
  return prerequisites;
};

// Map method to decision path description
const getDecisionPath = (method: string, methodName: string): string => {
  const paths: Record<string, string> = {
    t_test: '两组独立样本 → 连续变量 → 正态分布 → 独立样本 t 检验',
    paired_t_test: '配对样本 → 连续变量 → 正态分布 → 配对 t 检验',
    anova: '多组比较 → 连续变量 → 正态分布 → 单因素方差分析',
    chi_square: '分类变量 → 频率数据 → 卡方检验',
    pearson: '两个连续变量 → 正态分布 → Pearson 相关分析',
    spearman: '两个变量 → 非正态/有序 → Spearman 秩相关',
    mann_whitney: '两组独立样本 → 非正态分布 → Mann-Whitney U 检验',
    wilcoxon: '配对样本 → 非正态分布 → Wilcoxon 符号秩检验',
    kruskal_wallis: '多组比较 → 非正态分布 → Kruskal-Wallis 检验',
    linear_regression: '预测关系 → 连续因变量 → 线性回归分析',
  };
  return paths[method] || `根据数据特征选择 → ${methodName}`;
};

const STEP_ICONS = [
  <DataIcon key="data" />,
  <CheckIcon key="check" />,
  <TreeIcon key="tree" />,
  <CalcIcon key="calc" />,
  <SpeedIcon key="speed" />,
  <LightbulbIcon key="bulb" />,
];

const STEP_TITLES = [
  '数据识别',
  '前提条件校验',
  '方法选择',
  '统计计算',
  '效应量分析',
  '结论与建议',
];

const AnalysisSteps: React.FC<AnalysisStepsProps> = ({ result, dataSummary }) => {
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]));

  const handleChange = (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isExpanded) {
        next.add(panel);
      } else {
        next.delete(panel);
      }
      return next;
    });
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        // Step 1: Data identification
        return (
          <Box>
            {dataSummary && (
              <>
                <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
                  <strong style={{ color: '#00e676' }}>变量数:</strong> {dataSummary.columns} 列
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
                  <strong style={{ color: '#00e676' }}>样本量:</strong> {dataSummary.rows} 行
                </Typography>
                <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
                  <strong style={{ color: '#00e676' }}>变量列表:</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {dataSummary.column_names.map((col) => (
                    <Chip
                      key={col}
                      label={`${col} (${dataSummary.column_types[col] || '未知'})`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </>
            )}
            <Typography variant="body2" sx={{ mt: 1.5, color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>分析类型:</strong> {result.method_name}
            </Typography>
          </Box>
        );

      case 1:
        // Step 2: Prerequisites check
        return (
          <Box>
            {getPrerequisites(result.method, dataSummary?.rows || 0).map((pre, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <DoneIcon sx={{ fontSize: 16, color: '#00e676' }} />
                <Typography variant="body2" sx={{ color: '#e0f2f1' }}>{pre}</Typography>
              </Box>
            ))}
          </Box>
        );

      case 2:
        // Step 3: Method selection
        return (
          <Box>
            <Box sx={{ mb: 1.5 }}>
              <MethodBadge method={result.method} methodName={result.method_name} />
            </Box>
            <Typography variant="body2" sx={{ color: '#80cbc4' }}>
              <strong style={{ color: '#00e676' }}>决策路径:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#e0f2f1' }}>
              {getDecisionPath(result.method, result.method_name)}
            </Typography>
          </Box>
        );

      case 3:
        // Step 4: Statistical calculation
        return (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <StatCard
              title="p 值"
              value={result.p_value}
              type="pvalue"
              significant={result.significant}
            />
            <StatCard
              title="显著性"
              value={result.significant ? '显著' : '不显著'}
              type="significance"
              significant={result.significant}
            />
          </Box>
        );

      case 4:
        // Step 5: Effect size analysis
        return (
          <Box>
            <EffectSizeBar effectSize={result.effect_size} />
          </Box>
        );

      case 5:
        // Step 6: Conclusions & suggestions
        return (
          <Box>
            <Typography variant="body2" sx={{ color: '#80cbc4' }} gutterBottom>
              统计结论
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#e0f2f1' }}>
              {result.significant
                ? `p = ${result.p_value < 0.001 ? '< 0.001' : result.p_value.toFixed(3)}，差异具有统计学显著性（α = 0.05）。`
                : `p = ${result.p_value.toFixed(3)}，差异不具有统计学显著性（α = 0.05）。`}
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" sx={{ color: '#80cbc4' }} gutterBottom>
              业务解读
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, color: '#e0f2f1' }}>
              {result.interpretation}
            </Typography>

            {result.visualizations && result.visualizations.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {result.visualizations.map((chart, index) => (
                  <ChartContainer key={index} config={chart} />
                ))}
              </Box>
            )}

            <Suggestions suggestions={result.suggestions} />
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {STEP_TITLES.map((title, index) => (
        <Accordion
          key={index}
          expanded={expanded.has(index)}
          onChange={handleChange(index)}
          disableGutters
          sx={{
            boxShadow: 'none',
            border: '1px solid rgba(0, 230, 118, 0.12)',
            borderRadius: index === 0 ? '8px 8px 0 0' : index === 5 ? '0 0 8px 8px' : 0,
            '&:not(:last-of-type)': { borderBottom: 0 },
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: '#80cbc4' }} />}
            sx={{
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1.5,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'rgba(0, 230, 118, 0.15)',
                color: '#00e676',
                flexShrink: 0,
                boxShadow: '0 0 8px rgba(0, 230, 118, 0.2)',
              }}
            >
              {React.cloneElement(STEP_ICONS[index], { sx: { fontSize: 16 } })}
            </Box>
            <Typography variant="subtitle2" sx={{ color: '#e0f2f1' }}>
              步骤 {index + 1}: {title}
            </Typography>
            <DoneIcon sx={{ fontSize: 18, color: '#00e676', ml: 'auto', mr: 1 }} />
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, px: 3, pb: 2 }}>
            {renderStepContent(index)}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default AnalysisSteps;
