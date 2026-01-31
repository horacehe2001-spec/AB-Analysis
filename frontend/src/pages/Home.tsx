import React from 'react';
import { Box, Typography, Chip, Divider } from '@mui/material';
import Layout from '../components/Layout/Layout';
import Sidebar from '../components/Layout/Sidebar';
import AnalysisProgress from '../components/Analysis/AnalysisProgress';
import AnalysisSteps from '../components/Analysis/AnalysisSteps';
import SpcProgress from '../components/Analysis/SpcProgress';
import SpcSteps from '../components/Analysis/SpcSteps';
import ConclusionPanel from '../components/Analysis/ConclusionPanel';
import MessageList from '../components/Chat/MessageList';
import ExportButton from '../components/Export/ExportButton';
import CapabilityPage from './CapabilityPage';
import StabilityPage from './StabilityPage';
import SpcPage from './SpcPage';
import { useSessionStore } from '../store/sessionStore';
import { useChatStore } from '../store/chatStore';
import { useAppStore } from '../store/appStore';
import { exportApi } from '../api/export';

const QUICK_FOLLOW_UPS = ['换个方法试试', '去掉异常值', '分组分析', '查看分布'];

const Home: React.FC = () => {
  const { activeModule } = useAppStore();
  const { dataSummary } = useSessionStore();
  const {
    sessionId,
    messages,
    isLoading,
    sendMessage,
    multiAnalysisResults,
    conclusion,
    isConclusionLoading,
    setConclusion,
    setConclusionLoading,
  } = useChatStore();

  // Find the latest analysis result from messages
  const latestAnalysis = [...messages].reverse().find((m) => m.analysis)?.analysis || null;

  const handleFollowUp = (text: string) => {
    sendMessage(text);
  };

  const hasMultiResults = multiAnalysisResults.length > 0;
  const hasAnalysis = hasMultiResults || latestAnalysis;

  const handleGenerateConclusion = React.useCallback(async () => {
    if (!sessionId) {
      setConclusion('请先完成一次分析后再生成报告结论');
      return;
    }
    setConclusionLoading(true);
    try {
      const analyses: {
        x_variable?: string;
        y_variable?: string;
        method: string;
        method_name: string;
        p_value: number | null;
        significant: boolean;
        effect_size: Record<string, unknown>;
        interpretation: string;
        suggestions: string[];
      }[] = [];

      if (hasMultiResults) {
        for (const r of multiAnalysisResults) {
          analyses.push({
            x_variable: r.xVariable,
            y_variable: r.yVariable,
            method: r.analysis.method,
            method_name: r.analysis.method_name,
            p_value: r.analysis.p_value,
            significant: r.analysis.significant,
            effect_size: r.analysis.effect_size as unknown as Record<string, unknown>,
            interpretation: r.analysis.interpretation,
            suggestions: r.analysis.suggestions,
          });
        }
      } else if (latestAnalysis) {
        analyses.push({
          method: latestAnalysis.method,
          method_name: latestAnalysis.method_name,
          p_value: latestAnalysis.p_value,
          significant: latestAnalysis.significant,
          effect_size: latestAnalysis.effect_size as unknown as Record<string, unknown>,
          interpretation: latestAnalysis.interpretation,
          suggestions: latestAnalysis.suggestions,
        });
      }

      const response = await exportApi.generateConclusion({
        session_id: sessionId,
        analyses,
        data_summary: dataSummary as unknown as Record<string, unknown>,
      });

      setConclusion(response.conclusion);
    } catch (error) {
      const msg = error instanceof Error ? error.message : '生成结论失败';
      setConclusion(`生成失败: ${msg}`);
    } finally {
      setConclusionLoading(false);
    }
  }, [sessionId, hasMultiResults, multiAnalysisResults, latestAnalysis, dataSummary, setConclusion, setConclusionLoading]);

  // Auto-generate conclusion when analysis results arrive
  const prevHasAnalysisRef = React.useRef(false);
  React.useEffect(() => {
    if (hasAnalysis && !prevHasAnalysisRef.current && !conclusion && !isConclusionLoading) {
      prevHasAnalysisRef.current = true;
      handleGenerateConclusion();
    }
    if (!hasAnalysis) {
      prevHasAnalysisRef.current = false;
    }
  }, [hasAnalysis, conclusion, isConclusionLoading, handleGenerateConclusion]);

  const renderHypothesisContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: '#e0f2f1' }}>
          {hasMultiResults
            ? `分析结果（共 ${multiAnalysisResults.length} 组）`
            : '分析结果'}
        </Typography>
        {sessionId && (
          <ExportButton sessionId={sessionId} disabled={!hasAnalysis || isLoading} />
        )}
      </Box>

      {/* Multi-group analysis results */}
      {hasMultiResults ? (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {multiAnalysisResults.map((result, index) => (
            <Box key={`${result.xVariable}-${result.yVariable}`} sx={{ mb: 3 }}>
              {index > 0 && (
                <Divider sx={{ mb: 2, borderColor: 'rgba(0, 230, 118, 0.15)' }} />
              )}
              <Typography
                variant="h6"
                sx={{
                  color: '#42a5f5',
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'rgba(66, 165, 245, 0.15)',
                    border: '1px solid rgba(66, 165, 245, 0.3)',
                    fontSize: '0.85rem',
                  }}
                >
                  {index + 1}
                </Box>
                {result.xVariable}
                <Box component="span" sx={{ color: '#80cbc4', mx: 0.5 }}>→</Box>
                {result.yVariable}
              </Typography>
              <AnalysisProgress activeStep={6} isLoading={false} />
              <AnalysisSteps result={result.analysis} dataSummary={dataSummary} />
            </Box>
          ))}

          {/* Conclusion panel after all multi-group results */}
          <Divider sx={{ my: 2, borderColor: 'rgba(255, 171, 64, 0.2)' }} />
          <ConclusionPanel
            conclusion={conclusion}
            isLoading={isConclusionLoading}
            onGenerate={handleGenerateConclusion}
          />
        </Box>
      ) : latestAnalysis ? (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <AnalysisProgress activeStep={6} isLoading={false} />
          <AnalysisSteps result={latestAnalysis} dataSummary={dataSummary} />

          {/* Conclusion panel after single analysis */}
          <Divider sx={{ my: 2, borderColor: 'rgba(255, 171, 64, 0.2)' }} />
          <ConclusionPanel
            conclusion={conclusion}
            isLoading={isConclusionLoading}
            onGenerate={handleGenerateConclusion}
          />
        </Box>
      ) : isLoading ? (
        <Box sx={{ flexGrow: 1 }}>
          <AnalysisProgress activeStep={2} isLoading />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <Typography sx={{ color: '#80cbc4' }}>正在分析中，请稍候...</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1 }}>
          {/* Show message history when no analysis yet */}
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            <MessageList messages={messages} isLoading={isLoading} />
          </Box>
        </Box>
      )}

      {/* Follow-up buttons */}
      {hasAnalysis && (
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          pt: 1.5,
          borderTop: '1px solid rgba(0, 230, 118, 0.12)',
        }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1, color: '#80cbc4' }}>
            继续追问:
          </Typography>
          {QUICK_FOLLOW_UPS.map((text) => (
            <Chip
              key={text}
              label={text}
              onClick={() => handleFollowUp(text)}
              disabled={isLoading}
              variant="outlined"
              color="primary"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(0, 230, 118, 0.12)',
                  boxShadow: '0 0 8px rgba(0, 230, 118, 0.2)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const renderSpcContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ color: '#e0f2f1' }}>
          {hasMultiResults
            ? `SPC 分析结果（共 ${multiAnalysisResults.length} 组）`
            : 'SPC 分析结果'}
        </Typography>
        {sessionId && (
          <ExportButton sessionId={sessionId} disabled={!hasAnalysis || isLoading} />
        )}
      </Box>

      {/* Multi-group SPC results */}
      {hasMultiResults ? (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          {multiAnalysisResults.map((result, index) => (
            <Box key={`${result.xVariable}-${result.yVariable}`} sx={{ mb: 3 }}>
              {index > 0 && (
                <Divider sx={{ mb: 2, borderColor: 'rgba(0, 230, 118, 0.15)' }} />
              )}
              <Typography
                variant="h6"
                sx={{
                  color: '#42a5f5',
                  mb: 1.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'rgba(66, 165, 245, 0.15)',
                    border: '1px solid rgba(66, 165, 245, 0.3)',
                    fontSize: '0.85rem',
                  }}
                >
                  {index + 1}
                </Box>
                {result.yVariable}
              </Typography>
              <SpcProgress activeStep={5} isLoading={false} />
              <SpcSteps result={result.analysis} dataSummary={dataSummary} />
            </Box>
          ))}

          {/* Conclusion panel after all multi-group results */}
          <Divider sx={{ my: 2, borderColor: 'rgba(255, 171, 64, 0.2)' }} />
          <ConclusionPanel
            conclusion={conclusion}
            isLoading={isConclusionLoading}
            onGenerate={handleGenerateConclusion}
          />
        </Box>
      ) : latestAnalysis ? (
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <SpcProgress activeStep={5} isLoading={false} />
          <SpcSteps result={latestAnalysis} dataSummary={dataSummary} />

          {/* Conclusion panel after single analysis */}
          <Divider sx={{ my: 2, borderColor: 'rgba(255, 171, 64, 0.2)' }} />
          <ConclusionPanel
            conclusion={conclusion}
            isLoading={isConclusionLoading}
            onGenerate={handleGenerateConclusion}
          />
        </Box>
      ) : isLoading ? (
        <Box sx={{ flexGrow: 1 }}>
          <SpcProgress activeStep={2} isLoading />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <Typography sx={{ color: '#80cbc4' }}>正在进行 SPC 分析，请稍候...</Typography>
          </Box>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ maxHeight: '60vh', overflow: 'auto' }}>
            <MessageList messages={messages} isLoading={isLoading} />
          </Box>
        </Box>
      )}

      {/* Follow-up buttons */}
      {hasAnalysis && (
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          pt: 1.5,
          borderTop: '1px solid rgba(0, 230, 118, 0.12)',
        }}>
          <Typography variant="body2" sx={{ alignSelf: 'center', mr: 1, color: '#80cbc4' }}>
            继续追问:
          </Typography>
          {QUICK_FOLLOW_UPS.map((text) => (
            <Chip
              key={text}
              label={text}
              onClick={() => handleFollowUp(text)}
              disabled={isLoading}
              variant="outlined"
              color="primary"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(0, 230, 118, 0.12)',
                  boxShadow: '0 0 8px rgba(0, 230, 118, 0.2)',
                },
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'hypothesis':
        return renderHypothesisContent();
      case 'capability':
        return <CapabilityPage />;
      case 'stability':
        return <StabilityPage />;
      case 'spc':
        return renderSpcContent();
      default:
        return renderHypothesisContent();
    }
  };

  return (
    <Layout sidebar={<Sidebar />}>
      {renderModuleContent()}
    </Layout>
  );
};

export default Home;
