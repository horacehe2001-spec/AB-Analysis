import React, { useEffect } from 'react';
import { Alert, Box, Button, Card, CardContent, Divider, TextField, Typography } from '@mui/material';
import Layout from '../components/Layout/Layout';
import ModelConfig from '../components/Settings/ModelConfig';
import { useConfigStore } from '../store/configStore';

const Settings: React.FC = () => {
  const {
    promptTemplates,
    isLoading,
    error,
    loadConfig,
    loadPrompts,
    savePrompts,
    setPromptTemplate,
  } = useConfigStore();

  useEffect(() => {
    void loadConfig();
    void loadPrompts();
  }, [loadConfig, loadPrompts]);

  const handleSavePrompts = async () => {
    try {
      await savePrompts();
      alert('Prompt 模板已保存');
    } catch {
      // handled in store
    }
  };

  return (
    <Layout>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h5">设置</Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <ModelConfig />

        <Divider />

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Prompt 模板</Typography>
              <Button variant="contained" onClick={handleSavePrompts} disabled={isLoading}>
                保存模板
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Intent"
                value={promptTemplates.intent}
                onChange={(e) => setPromptTemplate('intent', e.target.value)}
                multiline
                minRows={4}
              />
              <TextField
                label="Planning"
                value={promptTemplates.planning}
                onChange={(e) => setPromptTemplate('planning', e.target.value)}
                multiline
                minRows={4}
              />
              <TextField
                label="Interpret"
                value={promptTemplates.interpret}
                onChange={(e) => setPromptTemplate('interpret', e.target.value)}
                multiline
                minRows={4}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Layout>
  );
};

export default Settings;

