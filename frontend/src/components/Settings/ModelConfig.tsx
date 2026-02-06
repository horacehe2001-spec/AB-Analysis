import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Snackbar,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useConfigStore } from '../../store/configStore';
import { MODEL_PROVIDERS, MODELS, getProviderBaseUrl } from '../../constants/models';
import type { ModelProvider } from '../../types/config';

const ModelConfig: React.FC = () => {
  const {
    modelConfig,
    isLoading,
    error,
    setProvider,
    setApiKey,
    setBaseUrl,
    setModel,
    setTemperature,
    setMaxTokens,
    setTopP,
    saveConfig,
    testConnection,
    resetToDefault,
  } = useConfigStore();

  const [snackbar, setSnackbar] = React.useState<{ open: boolean; severity: 'success' | 'error' | 'info'; message: string }>({
    open: false, severity: 'info', message: '',
  });

  const showSnackbar = (severity: 'success' | 'error', message: string) => {
    setSnackbar({ open: true, severity, message });
  };

  const handleProviderChange = (_: React.MouseEvent, newProvider: ModelProvider | null) => {
    if (newProvider) {
      setProvider(newProvider);
      setBaseUrl(getProviderBaseUrl(newProvider));
      const models = MODELS[newProvider];
      if (models.length > 0) {
        setModel(models[0].value);
      }
    }
  };

  const handleTestConnection = async () => {
    const result = await testConnection();
    showSnackbar(result.success ? 'success' : 'error', result.message);
  };

  const handleSave = async () => {
    try {
      await saveConfig();
      showSnackbar('success', '配置保存成功');
    } catch {
      showSnackbar('error', error || '保存配置失败');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && <Alert severity="error">{error}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>模型提供商</Typography>
          <ToggleButtonGroup
            value={modelConfig.provider}
            exclusive
            onChange={handleProviderChange}
            sx={{ flexWrap: 'wrap' }}
          >
            {MODEL_PROVIDERS.map((provider) => (
              <ToggleButton key={provider.value} value={provider.value}>
                {provider.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>API 配置</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                label="API Key"
                type="password"
                value={modelConfig.api_key}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
              <Button variant="outlined" onClick={handleTestConnection} disabled={isLoading}>
                测试连接
              </Button>
            </Box>

            <TextField
              fullWidth
              label="Base URL (可选)"
              value={modelConfig.base_url || ''}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={getProviderBaseUrl(modelConfig.provider)}
              helperText="留空使用默认地址，支持代理"
            />

            <FormControl fullWidth>
              <InputLabel>模型</InputLabel>
              <Select
                value={modelConfig.model}
                label="模型"
                onChange={(e) => setModel(e.target.value)}
              >
                {MODELS[modelConfig.provider].map((model) => (
                  <MenuItem key={model.value} value={model.value}>
                    {model.label}
                  </MenuItem>
                ))}
                {modelConfig.provider === 'custom' && (
                  <MenuItem value={modelConfig.model}>{modelConfig.model || '自定义模型'}</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>模型参数</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography gutterBottom>Temperature: {modelConfig.temperature}</Typography>
              <Slider
                value={modelConfig.temperature}
                onChange={(_, v) => setTemperature(v as number)}
                min={0}
                max={2}
                step={0.1}
                marks={[{ value: 0, label: '0' }, { value: 1, label: '1' }, { value: 2, label: '2' }]}
              />
            </Box>

            <TextField
              label="Max Tokens"
              type="number"
              value={modelConfig.max_tokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              inputProps={{ min: 100, max: 32000 }}
            />

            <Box>
              <Typography gutterBottom>Top P: {modelConfig.top_p}</Typography>
              <Slider
                value={modelConfig.top_p}
                onChange={(_, v) => setTopP(v as number)}
                min={0}
                max={1}
                step={0.1}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={resetToDefault}>
          恢复默认
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={isLoading}>
          保存配置
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ModelConfig;
