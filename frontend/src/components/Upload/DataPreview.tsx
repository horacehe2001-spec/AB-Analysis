import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import type { DataSummary } from '../../types/session';

interface DataPreviewProps {
  fileName: string;
  summary: DataSummary;
}

const DataPreview: React.FC<DataPreviewProps> = ({ fileName, summary }) => {
  return (
    <Paper sx={{ p: 2, bgcolor: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.15)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#00e676' }}>
          {fileName}
        </Typography>
        <Chip label={`${summary.rows} 行`} size="small" variant="outlined" />
        <Chip label={`${summary.columns} 列`} size="small" variant="outlined" />
      </Box>
      <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {summary.column_names.slice(0, 8).map((col) => (
          <Chip key={col} label={col} size="small" variant="outlined" />
        ))}
        {summary.column_names.length > 8 && (
          <Chip label={`+${summary.column_names.length - 8} 更多`} size="small" sx={{ bgcolor: 'rgba(0, 230, 118, 0.1)', color: '#80cbc4' }} />
        )}
      </Box>
    </Paper>
  );
};

export default DataPreview;
