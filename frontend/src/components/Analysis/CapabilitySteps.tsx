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
  BarChart as BarChartIcon,
  Calculate as CalcIcon,
  Assessment as AssessmentIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as DoneIcon,
} from '@mui/icons-material';
import type { AnalysisResult } from '../../types/chat';
import type { DataSummary } from '../../types/session';
import Suggestions from './Suggestions';
import ChartContainer from '../Charts/ChartContainer';

interface CapabilityStepsProps {
  result: AnalysisResult;
  dataSummary: DataSummary | null;
}

const STEP_ICONS = [
  <DataIcon key="data" />,
  <BarChartIcon key="normality" />,
  <CalcIcon key="calc" />,
  <AssessmentIcon key="assess" />,
  <LightbulbIcon key="bulb" />,
];

const STEP_TITLES = [
  '数据识别',
  '正态性检验',
  '指标计算',
  '能力评估',
  '结论与建议',
];

const CapabilitySteps: React.FC<CapabilityStepsProps> = ({ result, dataSummary }) => {
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set([0, 1, 2, 3, 4]));

  const capData = result.visualizations?.[0]?.data as any;
  const cp = capData?.cp ?? null;
  const cpk = capData?.cpk ?? null;
  const pp = capData?.pp ?? null;
  const ppk = capData?.ppk ?? null;
  const usl = capData?.usl ?? null;
  const lsl = capData?.lsl ?? null;
  const mean = capData?.mean ?? null;
  const stdDev = capData?.std_dev ?? null;
  const sampleSize = capData?.sample_size ?? null;
  const normalityTest = capData?.normality_test ?? null;
  const ppm = capData?.ppm ?? null;

  const getCapabilityRating = (cpkVal: number | null): { label: string; color: string; grade: string } => {
    if (cpkVal === null) return { label: '无法评估', color: '#546e7a', grade: '—' };
    if (cpkVal >= 2.0) return { label: '优秀', color: '#2ecc71', grade: 'A' };
    if (cpkVal >= 1.67) return { label: '良好', color: '#27ae60', grade: 'B' };
    if (cpkVal >= 1.33) return { label: '可接受', color: '#f39c12', grade: 'C' };
    if (cpkVal >= 1.0) return { label: '勉强，需改进', color: '#e67e22', grade: 'D' };
    return { label: '不合格，必须改进', color: '#e74c3c', grade: 'F' };
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
        const yVariable = result.visualizations?.[0]?.title?.replace(/.*—\s*/, '') || '—';
        return (
          <Box>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>Y 变量:</strong> {yVariable}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>样本量:</strong> {sampleSize ?? '—'} 个数据点
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>均值 (μ):</strong> {mean !== null ? Number(mean).toFixed(4) : '—'}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>标准差 (σ):</strong> {stdDev !== null ? Number(stdDev).toFixed(4) : '—'}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ color: '#e0f2f1' }}>
              <strong style={{ color: '#00e676' }}>规格限:</strong> USL = {usl !== null ? Number(usl).toFixed(2) : '—'}, LSL = {lsl !== null ? Number(lsl).toFixed(2) : '—'}
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
        const isNormal = normalityTest?.is_normal ?? null;
        const pValue = normalityTest?.p_value ?? null;
        const method = normalityTest?.method ?? 'Shapiro-Wilk';
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#e0f2f1' }}>
                <strong style={{ color: '#00e676' }}>检验方法:</strong> {method}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="body2" sx={{ color: '#e0f2f1' }}>
                <strong style={{ color: '#00e676' }}>p 值:</strong> {pValue !== null ? Number(pValue).toFixed(4) : '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={isNormal ? '服从正态分布' : '不服从正态分布'}
                size="small"
                sx={{
                  bgcolor: isNormal
                    ? 'rgba(46, 204, 113, 0.15)'
                    : 'rgba(231, 76, 60, 0.15)',
                  color: isNormal ? '#2ecc71' : '#e74c3c',
                  border: `1px solid ${isNormal ? 'rgba(46, 204, 113, 0.3)' : 'rgba(231, 76, 60, 0.3)'}`,
                  fontWeight: 700,
                }}
              />
              <Typography variant="body2" sx={{ color: '#80cbc4' }}>
                {isNormal
                  ? '(p > 0.05, 数据符合正态假设，Cp/Cpk 有效)'
                  : '(p ≤ 0.05, 数据可能不服从正态分布，结果仅供参考)'}
              </Typography>
            </Box>
          </Box>
        );
      }

      case 2: {
        return (
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[
              { label: 'Cp（潜在能力）', value: cp, color: '#42a5f5' },
              { label: 'Cpk（实际能力）', value: cpk, color: '#00e676' },
              { label: 'Pp（长期潜在）', value: pp, color: '#ab47bc' },
              { label: 'Ppk（长期实际）', value: ppk, color: '#ffab40' },
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
                    ? Number(item.value).toFixed(3)
                    : '—'}
                </Typography>
              </Box>
            ))}
          </Box>
        );
      }

      case 3: {
        const rating = getCapabilityRating(cpk);
        return (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: `${rating.color}22`,
                  border: `2px solid ${rating.color}`,
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  color: rating.color,
                }}
              >
                {rating.grade}
              </Box>
              <Box>
                <Chip
                  label={rating.label}
                  sx={{
                    bgcolor: `${rating.color}22`,
                    color: rating.color,
                    border: `1px solid ${rating.color}55`,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                />
              </Box>
            </Box>

            {ppm !== null && (
              <Typography variant="body2" sx={{ color: '#e0f2f1', mb: 1 }}>
                <strong style={{ color: '#00e676' }}>预估不良率 (PPM):</strong>{' '}
                {Number(ppm).toFixed(1)} PPM（百万分之 {Number(ppm).toFixed(1)}）
              </Typography>
            )}

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" sx={{ color: '#80cbc4', mb: 0.5 }}>
              能力等级参考:
            </Typography>
            {[
              { grade: 'A', range: 'Cpk ≥ 2.0', label: '优秀' },
              { grade: 'B', range: 'Cpk ≥ 1.67', label: '良好' },
              { grade: 'C', range: 'Cpk ≥ 1.33', label: '可接受' },
              { grade: 'D', range: 'Cpk ≥ 1.0', label: '勉强' },
              { grade: 'F', range: 'Cpk < 1.0', label: '不合格' },
            ].map((row) => (
              <Typography
                key={row.grade}
                variant="caption"
                sx={{
                  color: cpk !== null && getCapabilityRating(cpk).grade === row.grade ? '#00e676' : '#546e7a',
                  display: 'block',
                  fontWeight: cpk !== null && getCapabilityRating(cpk).grade === row.grade ? 700 : 400,
                }}
              >
                {row.grade}: {row.range} — {row.label}
                {cpk !== null && getCapabilityRating(cpk).grade === row.grade ? ' ◀ 当前' : ''}
              </Typography>
            ))}
          </Box>
        );
      }

      case 4: {
        return (
          <Box>
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

export default CapabilitySteps;
