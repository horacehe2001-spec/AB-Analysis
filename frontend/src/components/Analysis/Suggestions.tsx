import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Lightbulb as LightbulbIcon } from '@mui/icons-material';

interface SuggestionsProps {
  suggestions: string[];
}

const Suggestions: React.FC<SuggestionsProps> = ({ suggestions }) => {
  if (!suggestions.length) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LightbulbIcon sx={{ color: '#ffab00', fontSize: 20 }} />
        <Typography variant="subtitle2" sx={{ color: '#e0f2f1' }}>建议</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {suggestions.map((suggestion, index) => (
          <Chip key={index} label={suggestion} size="small" variant="outlined" />
        ))}
      </Box>
    </Box>
  );
};

export default Suggestions;
