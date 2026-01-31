import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import type { Industry, SessionsQuery } from '../../types/session';
import { INDUSTRIES } from '../../constants/industries';

interface SearchFiltersProps {
  filters: SessionsQuery;
  onChange: (filters: SessionsQuery) => void;
  onSearch: () => void;
}

const METHODS = [
  { value: '', label: '全部方法' },
  { value: 't_test', label: 't 检验' },
  { value: 'mann_whitney_u', label: 'Mann–Whitney U' },
  { value: 'anova', label: 'ANOVA' },
  { value: 'kruskal', label: 'Kruskal–Wallis' },
  { value: 'linear_regression', label: '线性回归' },
  { value: 'pearson', label: 'Pearson 相关' },
  { value: 'spearman', label: 'Spearman 相关' },
  { value: 'chi_square', label: '卡方检验' },
];

const TIME_RANGES = [
  { value: '', label: '全部时间' },
  { value: 'today', label: '今天' },
  { value: '7days', label: '近7天' },
  { value: '30days', label: '近30天' },
];

const SearchFilters: React.FC<SearchFiltersProps> = ({ filters, onChange, onSearch }) => {
  const handleChange = (key: keyof SessionsQuery, value: any) => {
    onChange({ ...filters, [key]: value || undefined });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        size="small"
        placeholder="搜索关键词..."
        value={filters.keyword || ''}
        onChange={(e) => handleChange('keyword', e.target.value)}
        sx={{ minWidth: 200 }}
      />

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>行业</InputLabel>
        <Select
          value={filters.industry || ''}
          label="行业"
          onChange={(e) => handleChange('industry', e.target.value as Industry)}
        >
          <MenuItem value="">全部行业</MenuItem>
          {INDUSTRIES.map((ind) => (
            <MenuItem key={ind.value} value={ind.value}>
              {ind.icon} {ind.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>时间</InputLabel>
        <Select
          value={filters.start_date || ''}
          label="时间"
          onChange={(e) => handleChange('start_date', e.target.value)}
        >
          {TIME_RANGES.map((range) => (
            <MenuItem key={range.value} value={range.value}>
              {range.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>方法</InputLabel>
        <Select
          value={filters.method || ''}
          label="方法"
          onChange={(e) => handleChange('method', e.target.value)}
        >
          {METHODS.map((method) => (
            <MenuItem key={method.value} value={method.value}>
              {method.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="contained" startIcon={<SearchIcon />} onClick={onSearch}>
        搜索
      </Button>
    </Box>
  );
};

export default SearchFilters;
