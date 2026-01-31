import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { Industry } from '../../types/session';
import { INDUSTRIES } from '../../constants/industries';

interface IndustrySelectProps {
  value: Industry | '';
  onChange: (industry: Industry | null) => void;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

const IndustrySelect: React.FC<IndustrySelectProps> = ({
  value,
  onChange,
  size = 'small',
  fullWidth = false,
}) => {
  const handleChange = (event: SelectChangeEvent<string>) => {
    const newValue = event.target.value;
    onChange(newValue ? (newValue as Industry) : null);
  };

  return (
    <FormControl size={size} fullWidth={fullWidth} sx={{ minWidth: 150 }}>
      <InputLabel>行业分类</InputLabel>
      <Select value={value} label="行业分类" onChange={handleChange}>
        <MenuItem value="">
          <em>不选择</em>
        </MenuItem>
        {INDUSTRIES.map((industry) => (
          <MenuItem key={industry.value} value={industry.value}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{industry.icon}</span>
              <span>{industry.label}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default IndustrySelect;
