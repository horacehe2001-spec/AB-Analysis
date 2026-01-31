import React from 'react';
import { Chip } from '@mui/material';
import { Science as ScienceIcon } from '@mui/icons-material';

interface MethodBadgeProps {
  method: string;
  methodName: string;
}

const MethodBadge: React.FC<MethodBadgeProps> = ({ methodName }) => {
  return (
    <Chip
      icon={<ScienceIcon />}
      label={methodName}
      color="primary"
      variant="outlined"
      size="small"
    />
  );
};

export default MethodBadge;
