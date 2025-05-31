import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Alert,
  Share,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';
import { Button } from '../components/ui';
import { Colors, getThemeColors } from '../theme/colors';
import { Layout, Typography, Spacing, Shadows } from '../theme/spacing';
import { storage } from '../lib/storage/mmkv-setup';

type Props = RootStackScreenProps<'Analysis'>;

interface AnalysisData {
  shotId: string;
  instantFeedback: {
    detected: boolean;
    confidence: number;
  };
  fastAnalysis?: {
    overallScore: number;
    technique: {
      stance: number;
      grip: number;
      followThrough: number;
    };
  };
  fullAnalysis?: {
    overallScore: number;
    technique: {
      stance: number;
      grip: number;
      followThrough: number;
    };
    feedback: Array<{
      type: 'strength' | 'improvement';
      category: string;
      message: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    geminiResponse?: string;
  };
}

const AnalysisScreen: React.FC<Props> = ({ navigation, route }) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const { shotId, videoUri } = route.params;

  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loadingStage, setLoadingStage] = useState<'instant' | 'fast' | 'full' | 'complete'>(
    'instant',
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    simulateProgressiveAnalysis();
  }, [shotId]);

  const simulateProgressiveAnalysis = async () => {
    // Instant feedback (< 500ms)
    const instantFeedback = {
      shotId,
      instantFeedback: {
        detected: true,
        confidence: 0.95,
      },
    };
    setAnalysis(instantFeedback);

    // Fast analysis (< 3s)
    setTimeout(() => {
      setLoadingStage('fast');
      setAnalysis((prev) => ({
        ...prev!,
        fastAnalysis: {
          overallScore: 82,
          technique: {
            stance: 85,
            grip: 78,
            followThrough: 83,
          },
        },
      }));
    }, 2000);

    // Full analysis (< 15s)
    setTimeout(() => {
      setLoadingStage('full');
      setAnalysis((prev) => ({
        ...prev!,
        fullAnalysis: {
          overallScore: 84,
          technique: {
            stance: 87,
            grip: 79,
            followThrough: 86,
          },
          feedback: [
            {
              type: 'strength',
              category: 'Stance',
              message: 'Excellent balance and weight distribution',
              priority: 'high',
            },
            {
              type: 'improvement',
              category: 'Grip',
              message: 'Try positioning your hands slightly lower on the stick',
              priority: 'medium',
            },
            {
              type: 'improvement',
              category: 'Follow Through',
              message: 'Extend your follow-through for more power',
              priority: 'high',
            },
          ],
          geminiResponse:
            'Based on the analysis, your shot shows strong fundamentals with room for improvement in stick handling and follow-through technique.',
        },
      }));
      setLoadingStage('complete');
    }, 8000);
  };

  const renderProgressiveSection = () => {
    if (!analysis) return null;

    return (
      <View style={styles.analysisContainer}>
        {/* Instant Feedback */}
        <View style={[styles.feedbackCard, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="flash" size={20} color={colors.success[500]} />
            <Text style={[styles.feedbackTitle, { color: colors.text.primary }]}>
              Instant Detection
            </Text>
          </View>
          <Text style={[styles.feedbackContent, { color: colors.text.secondary }]}>
            Shot detected with {Math.round(analysis.instantFeedback.confidence * 100)}% confidence
          </Text>
        </View>

        {/* Fast Analysis */}
        {analysis.fastAnalysis || loadingStage === 'fast' ? (
          <View style={[styles.feedbackCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="speedometer" size={20} color={colors.info[500]} />
              <Text style={[styles.feedbackTitle, { color: colors.text.primary }]}>
                Quick Analysis
              </Text>
            </View>
            {analysis.fastAnalysis ? (
              <View>
                <Text style={[styles.scoreText, { color: colors.primary[500] }]}>
                  Overall Score: {analysis.fastAnalysis.overallScore}%
                </Text>
                <View style={styles.techniqueScores}>
                  {Object.entries(analysis.fastAnalysis.technique).map(([key, value]) => (
                    <View key={key} style={styles.techniqueRow}>
                      <Text style={[styles.techniqueLabel, { color: colors.text.secondary }]}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </Text>
                      <Text style={[styles.techniqueValue, { color: colors.text.primary }]}>
                        {value}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Analyzing technique...
              </Text>
            )}
          </View>
        ) : null}

        {/* Full Analysis */}
        {analysis.fullAnalysis || loadingStage === 'full' ? (
          <View style={[styles.feedbackCard, { backgroundColor: colors.background.secondary }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="analytics" size={20} color={colors.warning[500]} />
              <Text style={[styles.feedbackTitle, { color: colors.text.primary }]}>
                Detailed Analysis
              </Text>
            </View>
            {analysis.fullAnalysis ? (
              <View>
                <Text style={[styles.scoreText, { color: colors.primary[500] }]}>
                  Final Score: {analysis.fullAnalysis.overallScore}%
                </Text>

                {analysis.fullAnalysis.feedback.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.feedbackItem,
                      {
                        backgroundColor:
                          item.type === 'strength' ? colors.success[50] : colors.warning[50],
                      },
                    ]}
                  >
                    <View style={styles.feedbackItemHeader}>
                      <Ionicons
                        name={item.type === 'strength' ? 'checkmark-circle' : 'alert-circle'}
                        size={16}
                        color={item.type === 'strength' ? colors.success[500] : colors.warning[500]}
                      />
                      <Text style={[styles.feedbackCategory, { color: colors.text.primary }]}>
                        {item.category}
                      </Text>
                    </View>
                    <Text style={[styles.feedbackMessage, { color: colors.text.secondary }]}>
                      {item.message}
                    </Text>
                  </View>
                ))}

                {analysis.fullAnalysis.geminiResponse && (
                  <View style={[styles.aiInsight, { backgroundColor: colors.info[50] }]}>
                    <Text style={[styles.aiInsightTitle, { color: colors.info[700] }]}>
                      AI Insight
                    </Text>
                    <Text style={[styles.aiInsightText, { color: colors.text.secondary }]}>
                      {analysis.fullAnalysis.geminiResponse}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Generating detailed feedback...
              </Text>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `I just analyzed my hockey shot with Smart Hockey Coach! Overall score: ${analysis?.fullAnalysis?.overallScore || analysis?.fastAnalysis?.overallScore}%`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [analysis]);

  const handleNewRecording = useCallback(() => {
    navigation.navigate('Recording');
  }, [navigation]);

  const handleGoHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Video Player */}
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            onPlaybackStatusUpdate={(status) => {
              if ('isPlaying' in status) {
                setIsVideoPlaying(status.isPlaying || false);
              }
            }}
          />
        </View>

        {/* Progressive Analysis */}
        {renderProgressiveSection()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button variant="primary" onPress={handleNewRecording} style={styles.actionButton}>
            Record Another Shot
          </Button>

          <Button
            variant="secondary"
            onPress={handleShare}
            disabled={!analysis?.fullAnalysis}
            style={styles.actionButton}
          >
            Share Results
          </Button>

          <Button variant="ghost" onPress={handleGoHome} style={styles.actionButton}>
            Back to Home
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  videoContainer: {
    aspectRatio: 16 / 9,
    backgroundColor: 'black',
    marginBottom: Spacing.lg,
  },
  video: {
    flex: 1,
  },
  analysisContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  feedbackCard: {
    padding: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.md,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  feedbackTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.sm,
  },
  feedbackContent: {
    fontSize: Typography.fontSize.md,
  },
  scoreText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
  techniqueScores: {
    gap: Spacing.sm,
  },
  techniqueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  techniqueLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  techniqueValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
  loadingText: {
    fontSize: Typography.fontSize.md,
    fontStyle: 'italic',
  },
  feedbackItem: {
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginTop: Spacing.sm,
  },
  feedbackItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  feedbackCategory: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing.xs,
  },
  feedbackMessage: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  aiInsight: {
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginTop: Spacing.md,
  },
  aiInsightTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  aiInsightText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.sm,
  },
  actionButtons: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },
  actionButton: {
    width: '100%',
  },
});

export default React.memo(AnalysisScreen);
