import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Chip,
  Typography,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';

export type PickerMode = 'hypothesis' | 'spc';

interface VariablePickerDialogProps {
  open: boolean;
  onClose: () => void;
  columns: string[];
  onConfirm: (yVariable: string, xVariables: string[]) => void;
  mode?: PickerMode;
}

const modeTitles: Record<PickerMode, string> = {
  hypothesis: '选择分析变量',
  spc: '选择 SPC 分析变量',
};

const modeYLabels: Record<PickerMode, string> = {
  hypothesis: 'Y（因变量）— 拖入 1 个字段',
  spc: 'Y（监控指标）— 拖入 1 个字段',
};

const VariablePickerDialog: React.FC<VariablePickerDialogProps> = ({
  open,
  onClose,
  columns,
  onConfirm,
  mode = 'hypothesis',
}) => {
  const [yVariable, setYVariable] = useState<string | null>(null);
  const [xVariables, setXVariables] = useState<string[]>([]);
  const [dragOverZone, setDragOverZone] = useState<'x' | 'y' | null>(null);

  const selectedFields = new Set([yVariable, ...xVariables].filter(Boolean));

  const handleDragStart = (e: React.DragEvent, column: string) => {
    e.dataTransfer.setData('text/plain', column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropY = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
    const column = e.dataTransfer.getData('text/plain');
    if (!column) return;
    // Remove from X if it was there
    setXVariables((prev) => prev.filter((v) => v !== column));
    setYVariable(column);
  }, []);

  const handleDropX = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOverZone(null);
    const column = e.dataTransfer.getData('text/plain');
    if (!column) return;
    // Remove from Y if it was there
    setYVariable((prev) => (prev === column ? null : prev));
    setXVariables((prev) => {
      if (prev.includes(column)) return prev;
      if (prev.length >= 3) return prev;
      return [...prev, column];
    });
  }, []);

  const handleRemoveY = () => setYVariable(null);
  const handleRemoveX = (col: string) => setXVariables((prev) => prev.filter((v) => v !== col));

  const canConfirm = mode === 'spc'
    ? yVariable !== null
    : yVariable !== null && xVariables.length >= 1;

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm(yVariable!, xVariables);
      setYVariable(null);
      setXVariables([]);
    }
  };

  const handleClose = () => {
    setYVariable(null);
    setXVariables([]);
    onClose();
  };

  const dropZoneSx = (zone: 'x' | 'y') => ({
    minHeight: 64,
    p: 1.5,
    borderRadius: 2,
    border: '2px dashed',
    borderColor: dragOverZone === zone ? '#00e676' : 'rgba(128, 203, 196, 0.3)',
    bgcolor: dragOverZone === zone ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 1,
  });

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#1a2332',
          border: '1px solid rgba(0, 230, 118, 0.15)',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#e0f2f1',
          borderBottom: '1px solid rgba(128, 203, 196, 0.15)',
          pb: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScienceIcon sx={{ color: '#00e676' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {modeTitles[mode]}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: '#80cbc4' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Available fields */}
        <Typography variant="subtitle2" sx={{ color: '#80cbc4', mb: 1 }}>
          可用字段（拖拽到下方区域）
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 3,
            p: 1.5,
            borderRadius: 2,
            bgcolor: 'rgba(0, 0, 0, 0.15)',
            minHeight: 48,
          }}
        >
          {columns.map((col) => (
            <Chip
              key={col}
              label={col}
              draggable
              onDragStart={(e) => handleDragStart(e, col)}
              sx={{
                cursor: selectedFields.has(col) ? 'default' : 'grab',
                opacity: selectedFields.has(col) ? 0.4 : 1,
                bgcolor: selectedFields.has(col)
                  ? 'rgba(128, 128, 128, 0.2)'
                  : 'rgba(0, 230, 118, 0.12)',
                color: selectedFields.has(col) ? '#666' : '#e0f2f1',
                border: '1px solid',
                borderColor: selectedFields.has(col)
                  ? 'rgba(128, 128, 128, 0.2)'
                  : 'rgba(0, 230, 118, 0.3)',
                fontWeight: 500,
                '&:hover': selectedFields.has(col)
                  ? {}
                  : {
                      bgcolor: 'rgba(0, 230, 118, 0.2)',
                      boxShadow: '0 0 8px rgba(0, 230, 118, 0.25)',
                    },
                '&:active': { cursor: 'grabbing' },
              }}
            />
          ))}
        </Box>

        {/* Y Drop Zone */}
        <Typography variant="subtitle2" sx={{ color: '#ffab40', mb: 1 }}>
          {modeYLabels[mode]}
        </Typography>
        <Box
          onDragOver={handleDragOver}
          onDragEnter={() => setDragOverZone('y')}
          onDragLeave={() => setDragOverZone(null)}
          onDrop={handleDropY}
          sx={dropZoneSx('y')}
        >
          {yVariable ? (
            <Chip
              label={yVariable}
              onDelete={handleRemoveY}
              sx={{
                bgcolor: 'rgba(255, 171, 64, 0.2)',
                color: '#ffab40',
                border: '1px solid rgba(255, 171, 64, 0.4)',
                fontWeight: 600,
                '& .MuiChip-deleteIcon': { color: '#ffab40' },
              }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: '#546e7a', fontStyle: 'italic' }}>
              拖拽字段到此处...
            </Typography>
          )}
        </Box>

        {/* X Drop Zone (hypothesis mode only) */}
        {mode !== 'spc' && (
          <>
            <Typography variant="subtitle2" sx={{ color: '#42a5f5', mb: 1, mt: 2 }}>
              X（自变量）— 拖入最多 3 个字段
            </Typography>
            <Box
              onDragOver={handleDragOver}
              onDragEnter={() => setDragOverZone('x')}
              onDragLeave={() => setDragOverZone(null)}
              onDrop={handleDropX}
              sx={dropZoneSx('x')}
            >
              {xVariables.length > 0 ? (
                xVariables.map((col) => (
                  <Chip
                    key={col}
                    label={col}
                    onDelete={() => handleRemoveX(col)}
                    sx={{
                      bgcolor: 'rgba(66, 165, 245, 0.2)',
                      color: '#42a5f5',
                      border: '1px solid rgba(66, 165, 245, 0.4)',
                      fontWeight: 600,
                      '& .MuiChip-deleteIcon': { color: '#42a5f5' },
                    }}
                  />
                ))
              ) : (
                <Typography variant="body2" sx={{ color: '#546e7a', fontStyle: 'italic' }}>
                  拖拽字段到此处...
                </Typography>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          pb: 2,
          borderTop: '1px solid rgba(128, 203, 196, 0.15)',
        }}
      >
        <Button onClick={handleClose} sx={{ color: '#80cbc4' }}>
          取消
        </Button>
        <Button
          variant="contained"
          disabled={!canConfirm}
          onClick={handleConfirm}
          sx={{
            bgcolor: '#00e676',
            color: '#0a1628',
            fontWeight: 600,
            '&:hover': { bgcolor: '#00c853' },
            '&.Mui-disabled': {
              bgcolor: 'rgba(0, 230, 118, 0.15)',
              color: 'rgba(224, 242, 241, 0.3)',
            },
          }}
        >
          确认分析
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default VariablePickerDialog;
