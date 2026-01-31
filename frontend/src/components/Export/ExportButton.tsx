import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as WordIcon,
  Code as MarkdownIcon,
} from '@mui/icons-material';
import { exportApi } from '../../api/export';

interface ExportButtonProps {
  sessionId: string;
  disabled?: boolean;
}

const ExportButton: React.FC<ExportButtonProps> = ({ sessionId, disabled }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExport = async (format: 'md' | 'docx') => {
    handleClose();
    setIsExporting(true);

    try {
      const response = await exportApi.exportReport({
        session_id: sessionId,
        format,
        include_charts: true,
      });

      exportApi.downloadReport(response.download_url, response.file_name);
    } catch (error) {
      alert('导出失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={isExporting ? <CircularProgress size={16} /> : <DownloadIcon />}
        onClick={handleClick}
        disabled={disabled || isExporting}
      >
        导出报告
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={() => handleExport('md')}>
          <ListItemIcon>
            <MarkdownIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Markdown (.md)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleExport('docx')}>
          <ListItemIcon>
            <WordIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Word (.docx)</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default ExportButton;
