import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import * as echarts from 'echarts';
import type { ChartConfig } from '../../types/chat';

interface ChartContainerProps {
  config: ChartConfig;
  height?: number;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ config, height: heightProp }) => {
  const height = heightProp ?? (config.type === 'control_chart' ? 400 : 300);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option = getChartOption(config);
    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [config]);

  return (
    <Box sx={{ mb: 2 }}>
      {config.title && (
        <Typography variant="subtitle2" gutterBottom>
          {config.title}
        </Typography>
      )}
      <Box ref={chartRef} sx={{ width: '100%', height }} />
    </Box>
  );
};

function getChartOption(config: ChartConfig): echarts.EChartsOption {
  const baseOption: echarts.EChartsOption = {
    tooltip: { trigger: 'item' },
    grid: { left: '10%', right: '10%', bottom: '15%', top: '10%' },
  };

  const asArray = (v: any): any[] => (Array.isArray(v) ? v : []);

  const boxplotStats = (values: number[]): number[] => {
    const sorted = values.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const q = (p: number) => {
      if (sorted.length === 0) return 0;
      const idx = (sorted.length - 1) * p;
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      if (lo === hi) return sorted[lo];
      const w = idx - lo;
      return sorted[lo] * (1 - w) + sorted[hi] * w;
    };
    return [sorted[0] ?? 0, q(0.25), q(0.5), q(0.75), sorted[sorted.length - 1] ?? 0];
  };

  switch (config.type) {
    case 'scatter':
    case 'residual': {
      const points = Array.isArray(config.data)
        ? config.data
        : Array.isArray((config.data as any)?.points)
          ? (config.data as any).points
          : [];
      return {
        ...baseOption,
        xAxis: { type: 'value', name: config.xLabel },
        yAxis: { type: 'value', name: config.yLabel },
        series: [{
          type: 'scatter',
          data: points,
          symbolSize: 8,
        }],
      };
    }

    case 'bar': {
      // Backend shape (crosstab): { table: { col: { row: count } } }
      const table = (config.data as any)?.table;
      if (table && typeof table === 'object') {
        const seriesNames = Object.keys(table);
        const rowSet = new Set<string>();
        for (const col of seriesNames) {
          const rows = table[col] || {};
          Object.keys(rows).forEach((r) => rowSet.add(r));
        }
        const categories = Array.from(rowSet);
        const series = seriesNames.map((col) => ({
          name: col,
          type: 'bar' as const,
          stack: 'total',
          data: categories.map((r) => Number(table[col]?.[r] ?? 0)),
        }));
        return {
          ...baseOption,
          tooltip: { trigger: 'axis' },
          legend: { top: 0 },
          xAxis: { type: 'category', data: categories },
          yAxis: { type: 'value' },
          series,
        };
      }

      // Legacy shape: { categories, values }
      return {
        ...baseOption,
        xAxis: { type: 'category', data: (config.data as any).categories || [] },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: (config.data as any).values || [],
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        }],
      };
    }

    case 'box': {
      // Backend shape: { groups: [...], values: [[raw...],[raw...]] }
      const groups = (config.data as any)?.groups;
      const rawValues = (config.data as any)?.values;
      if (Array.isArray(groups) && Array.isArray(rawValues)) {
        const stats = asArray(rawValues).map((arr) => boxplotStats(asArray(arr).map((n) => Number(n))));
        return {
          ...baseOption,
          xAxis: { type: 'category', data: groups },
          yAxis: { type: 'value' },
          series: [{
            type: 'boxplot',
            data: stats,
          }],
        };
      }

      // Legacy: { categories, values } where values already contains boxplot stats
      return {
        ...baseOption,
        xAxis: { type: 'category', data: (config.data as any).categories || [] },
        yAxis: { type: 'value' },
        series: [{
          type: 'boxplot',
          data: (config.data as any).values || [],
        }],
      };
    }

    case 'distribution': {
      const bins = (config.data as any)?.bins;
      const counts = (config.data as any)?.counts;
      if (Array.isArray(bins) && Array.isArray(counts)) {
        const labels = bins.map((b: any) => Array.isArray(b) ? `${b[0]}-${b[1]}` : String(b));
        return {
          ...baseOption,
          xAxis: { type: 'category', data: labels, name: config.xLabel },
          yAxis: { type: 'value', name: config.yLabel },
          series: [{
            type: 'bar',
            data: counts,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
          }],
        };
      }
      return {
        ...baseOption,
        xAxis: { type: 'category', data: (config.data as any).bins || [] },
        yAxis: { type: 'value' },
        series: [{
          type: 'bar',
          data: (config.data as any).counts || [],
          itemStyle: { borderRadius: [4, 4, 0, 0] },
        }],
      };
    }

    case 'control_chart': {
      const chartData = config.data as any;
      const points = Array.isArray(chartData?.points) ? chartData.points : [];
      const ucl = Number(chartData?.ucl ?? 0);
      const cl = Number(chartData?.cl ?? 0);
      const lcl = Number(chartData?.lcl ?? 0);
      const chartType = chartData?.chart_type ?? '';

      const xData = points.map((p: any) => p.x);
      const yData = points.map((p: any) => p.y);
      const normalPoints = points
        .filter((p: any) => !p.is_anomaly)
        .map((p: any) => [p.x, p.y]);
      const anomalyPoints = points
        .filter((p: any) => p.is_anomaly)
        .map((p: any) => [p.x, p.y]);

      const ruleDescriptions: Record<number, string> = {
        1: '1点超出3σ',
        2: '连续9点同侧',
        3: '连续6点递增/递减',
        4: '连续14点交替',
        5: '3中2超2σ',
        6: '5中4超1σ',
        7: '15点在1σ内',
        8: '8点在1σ外',
      };

      return {
        ...baseOption,
        tooltip: {
          trigger: 'axis',
          formatter: (params: any) => {
            const items = Array.isArray(params) ? params : [params];
            const lineItem = items.find((i: any) => i.seriesName === '数据');
            const anomalyItem = items.find((i: any) => i.seriesName === '异常点');
            const pt = anomalyItem || lineItem;
            if (!pt) return '';
            const idx = pt.data?.[0] ?? pt.dataIndex;
            const val = pt.data?.[1] ?? pt.data;
            const pointData = points.find((p: any) => p.x === idx);
            let tip = `#${idx}: ${Number(val).toFixed(4)}`;
            if (pointData?.rule_violated?.length) {
              const rules = pointData.rule_violated
                .map((r: number) => ruleDescriptions[r] || `规则${r}`)
                .join('、');
              tip += `<br/><span style="color:#e74c3c">触发: ${rules}</span>`;
            }
            return tip;
          },
        },
        legend: { top: 0, data: ['数据', '异常点', 'UCL', 'CL', 'LCL'] },
        xAxis: { type: 'value', name: '样本序号', min: 1, max: xData.length },
        yAxis: { type: 'value', name: chartType },
        series: [
          {
            name: '数据',
            type: 'line',
            data: points.map((p: any) => [p.x, p.y]),
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: '#3498db' },
            itemStyle: { color: '#3498db' },
          },
          {
            name: '异常点',
            type: 'scatter',
            data: anomalyPoints,
            symbolSize: 12,
            itemStyle: { color: '#e74c3c' },
            z: 10,
          },
          {
            name: 'UCL',
            type: 'line',
            data: xData.map((x: number) => [x, ucl]),
            symbol: 'none',
            lineStyle: { color: '#e74c3c', type: 'dashed', width: 1.5 },
            markLine: undefined,
          },
          {
            name: 'CL',
            type: 'line',
            data: xData.map((x: number) => [x, cl]),
            symbol: 'none',
            lineStyle: { color: '#2ecc71', type: 'solid', width: 2 },
          },
          {
            name: 'LCL',
            type: 'line',
            data: xData.map((x: number) => [x, lcl]),
            symbol: 'none',
            lineStyle: { color: '#e74c3c', type: 'dashed', width: 1.5 },
          },
        ],
      };
    }

    default:
      return baseOption;
  }
}

export default ChartContainer;
