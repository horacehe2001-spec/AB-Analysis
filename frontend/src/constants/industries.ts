import type { Industry } from '../types/session';

export interface IndustryOption {
  value: Industry;
  label: string;
  icon: string;
  description: string;
}

export const INDUSTRIES: IndustryOption[] = [
  {
    value: 'ecommerce',
    label: '电商零售',
    icon: '🛒',
    description: '销售额分析、转化率、客单价'
  },
  {
    value: 'finance',
    label: '金融保险',
    icon: '💰',
    description: '风控模型、理赔分析、投资收益'
  },
  {
    value: 'healthcare',
    label: '医疗健康',
    icon: '🏥',
    description: '临床试验、疗效对比、患者分析'
  },
  {
    value: 'education',
    label: '教育培训',
    icon: '📚',
    description: '成绩分析、课程效果、学员留存'
  },
  {
    value: 'manufacturing',
    label: '制造业',
    icon: '🏭',
    description: '质量检测、产能分析、良品率'
  },
  {
    value: 'internet',
    label: '互联网',
    icon: '🌐',
    description: '用户增长、留存率、A/B测试'
  },
  {
    value: 'hr',
    label: '人力资源',
    icon: '👥',
    description: '绩效评估、薪酬分析、招聘效果'
  },
  {
    value: 'marketing',
    label: '市场营销',
    icon: '📢',
    description: '广告效果、渠道ROI、品牌认知'
  },
  {
    value: 'other',
    label: '其他',
    icon: '📊',
    description: '自定义场景'
  },
];

export const getIndustryLabel = (value: Industry): string => {
  return INDUSTRIES.find(i => i.value === value)?.label || '未知';
};

export const getIndustryIcon = (value: Industry): string => {
  return INDUSTRIES.find(i => i.value === value)?.icon || '📊';
};
