import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
} from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { uploadApi } from '../../api/upload';
import { useSessionStore } from '../../store/sessionStore';
import { useChatStore } from '../../store/chatStore';
import IndustrySelect from '../Industry/IndustrySelect';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { industry, setIndustry, setCurrentFile } = useSessionStore();
  const { setSessionId, addMessage } = useChatStore();

  const handleFile = async (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      setError('请上传 CSV 或 Excel 文件');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('文件大小不能超过 50MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadApi.uploadFile(file, industry || undefined);

      setSessionId(response.session_id);
      setCurrentFile(response.file_name, response.data_summary);

      // Add system message about the uploaded file
      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: `数据已加载: **${response.file_name}**\n\n` +
          `- 样本量: ${response.data_summary.rows} 行\n` +
          `- 变量数: ${response.data_summary.columns} 列\n` +
          `- 列名: ${response.data_summary.column_names.join(', ')}\n\n` +
          `请描述您的分析需求，例如："广告费对销售额有影响吗？"`,
        timestamp: new Date(),
      });

      onUploadSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [industry]);

  const handleClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file);
      }
    };
    input.click();
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: isDragging ? '#00e676' : 'rgba(0, 230, 118, 0.25)',
          bgcolor: isDragging ? 'rgba(0, 230, 118, 0.08)' : 'rgba(0, 230, 118, 0.03)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: '#00e676',
            bgcolor: 'rgba(0, 230, 118, 0.08)',
          },
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <Box sx={{ textAlign: 'center' }}>
          <UploadIcon sx={{ fontSize: 48, color: '#00e676', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#e0f2f1' }}>
            拖拽上传 CSV/Excel 文件
          </Typography>
          <Typography variant="body2" sx={{ color: '#80cbc4' }}>
            或点击选择文件（最大 50MB）
          </Typography>
        </Box>

        {isUploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" align="center" sx={{ mt: 1, color: '#80cbc4' }}>
              正在上传...
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IndustrySelect
          value={industry || ''}
          onChange={(val) => setIndustry(val)}
        />
        <Typography variant="body2" sx={{ color: '#80cbc4' }}>
          选择行业分类，便于知识归类管理
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;
