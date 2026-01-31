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
  AccountTree as TreeIcon,
  Calculate as CalcIcon,
  Warning as WarningIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';
import type { AnalysisResult } from '../../types/chat';
import type { DataSummary } from '../../types/session';
import Suggestions from './Suggestions';
import ChartContainer from '../Charts/ChartContainer';

interface SpcStepsProps {
  result: AnalysisResult;
  dataSummary: DataSummary | null;
}

const STEP_ICONS = [
  <DataIcon key="data" />,
  <TreeIcon key="tree" />,
  <CalcIcon key="calc" />,
  <WarningIcon key="warning" />,
  <LightbulbIcon key="bulb" />,
];

const STEP_TITLES = [
  '数据识别',
  '图型选择',
  '控制限计算',
  '异常检测',
  '结论与建议',
];

const RULE_DESCRIPTIONS: Record<number, string> = {
  1: '1点超出3σ控制限',
  2: '连续9点落在中心线同侧',
  3: '连续6点递增或递减',
  4: '连续14点交替上下',
  5: '3点中有2点超出2σ',
  6: '5点中有4点超出1σ',
  7: '连续15点在1σ范围内',
  8: '连续8点在1σ范围外',
};

const SpcSteps: React.FC<SpcStepsProps> = ({ result, dataSummary }) => {
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set([0, 1, 2, 3, 4]));

  const chartData = result.visualizations?.[0]?.data as any;
  const points = Array.isArray(chartData?.points) ? chartData.points : [];
  const ucl = chartData?.ucl ?? null;
  const cl = chartData?.cl ?? null;
  const lcl = chartData?.lcl ?? null;
  const chartType = chartData?.chart_type ?? '';

  const anomalyPoints = points.filter((p: any) => p.is_anomaly);

  // Collect all violated rules
  const violatedRules = new Set<number>();
  for (const p of anomalyPoints) {
    if (Array.isArray(p.rule_violated)) {
      p.rule_violated.forEach((r: number) => violatedRules.add(r));
    }
  }

  // Determine process status
  const getProcessStatus = (): { label: string; color: string } => {
    if (anomalyPoints.length === 0) return { label: '受控', color: '#2ecc71' };
    if (anomalyPoints.length <= 2) return { label: '预警', color: '#f39c12' };
    return { label: '失控', color: '#e74c3c' };
  };

  const handleChange = (panel: number) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isExpanded) next.add(panel);
      else next.delete(panel);
      return next;
    });
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: {
        // Step 1: Data identification
        const yVariable = result.visualizations?.[0]?.title?.replace(/.*—\s*/, '') || '—';
        return (
          <Box>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>Y 变量:</strong> {yVariable}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>样本量:</strong> {points.length} 个数据点
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>数据类型:</strong> 连续型（计量数据）
            </Typography>
            {dataSummary && (
              <Typography variant="body2" sx={{ color: '#e0f2f1' }}>
                <strong style={{ color: '#00e676' }}>原始数据集:</strong> {dataSummary.rows} 行 x {dataSummary.columns} 列
              </Typography>
            )}
          </Box>
        );
      }

      case 1: {
        // Step 2: Chart type selection
        const chartTypeReasons: Record<string, string> = {
          'IX-MR': '单值数据（子组大小=1），适用于个别值与移动极差控制图',
          'Xbar-R': '子组数据（子组大小2-9），适用于均值-极差控制图',
          'Xbar-S': '子组数据（子组大小≥10），适用于均值-标准差控制图',
          'P': '不合格品率数据，适用于 P 控制图',
          'NP': '不合格品数数据，适用于 NP 控制图',
          'C': '缺陷数数据（固定检验单位），适用于 C 控制图',
          'U': '单位缺陷数数据（可变检验单位），适用于 U 控制图',
        };
        return (
          <Box>
            <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={chartType || '未知'}
                sx={{
                  bgcolor: 'rgba(66, 165, 245, 0.15)',
                  color: '#42a5f5',
                  border: '1px solid rgba(66, 165, 245, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              />
              <Typography variant="body2" sx={{ color: '#e0f2f1' }}>控制图</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#80cbc4' }}>
              <strong style={{ color: '#00e676' }}>选型依据:</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#e0f2f1' }}>
              {chartTypeReasons[chartType] || `根据数据特征选择 ${chartType} 控制图`}
            </Typography>
          </Box>
        );
      }

      case 2: {
        // Step 3: Control limits calculation
        const sigma = ucl !== null && cl !== null ? ((ucl - cl) / 3) : null;
        return (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'UCL (上控制限)', value: ucl, color: '#e74c3c' },
              { label: 'CL (中心线)', value: cl, color: '#2ecc71' },
              { label: 'LCL (下控制限)', value: lcl, color: '#e74c3c' },
              { label: 'σ (标准差)', value: sigma, color: '#42a5f5' },
            ].map((item) => (
              <Box
                key={item.label}
                sx={{
                  flex: '1 1 140px',
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'rgba(0, 230, 118, 0.05)',
                  border: '1px solid rgba(0, 230, 118, 0.12)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#80cbc4' }}>
                  {item.label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: item.color, fontWeight: 700, fontFamily: 'monospace' }}
                >
                  {item.value !== null && item.value !== undefined
                    ? Number(item.value).toFixed(2)
                    : '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      }

      case 3: {
        // Step 4: Anomaly detection (Western Electric rules)
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#e0f2f1' }}>
                <strong style={{ color: '#00e676' }}>异常点数:</strong>
              </Typography>
              <Chip
                label={`${anomalyPoints.length} / ${points.length}`}
                size="small"
                sx={{
                  bgcolor: anomalyPoints.length > 0
                    ? 'rgba(231, 76, 60, 0.15)'
                    : 'rgba(46, 204, 113, 0.15)',
                  color: anomalyPoints.length > 0 ? '#e74c3c' : '#2ecc71',
                  border: `1px solid ${anomalyPoints.length > 0 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(46, 204, 113, 0.3)'}`,
                  fontWeight: 700,
                }}
              />
            </Box>

            {violatedRules.size > 0 ? (
              <Box>
                <Typography variant="body2" sx={{ color: '#80cbc4', mb: 1 }}>
                  <strong style={{ color: '#00e676' }}>触发的西联规则:</strong>
                </Typography>
                {Array.from(violatedRules).sort((a, b) => a - b).map((rule) => (
                  <Box key={rule} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <WarningIcon sx={{ fontSize: 16, color: '#e74c3c' }} />
                    <Typography variant="body2" sx={{ color: '#e0f2f1' }}>
                      规则 {rule}: {RULE_DESCRIPTIONS[rule] || `自定义规则 ${rule}`}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DoneIcon sx={{ fontSize: 16, color: '#2ecc71' }} />
                <Typography variant="body2" sx={{ color: '#e0f2f1' }}>
                  未触发任何西联规则，过程数据表现正常
                </Typography>
              </Box>
            )}
          </Box>
        );
      }

      case 4: {
        // Step 5: Conclusion & suggestions
        const status = getProcessStatus();
        return (
          <Box>
            <Typography variant="body2" sx={{ color: '#80cbc4' }} gutterBottom>
              过程状态
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={status.label}
                sx={{
                  bgcolor: `${status.color}22`,
                  color: status.color,
                  border: `1px solid ${status.color}55`,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              />
              <Typography variant="body2" sx={{ color: '#e0f2f1' }}>
                {anomalyPoints.length === 0
                  ? '过程处于统计受控状态，无异常信号。'
                  : `检测到 ${anomalyPoints.length} 个异常点，过程存在特殊原因变异。`}
              </Typography>
            </Box>

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
      }

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
            borderRadius: index === 0 ? '8px 8px 0 0' : index === 4 ? '0 0 8px 8px' : 0,
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

export default SpcSteps;
