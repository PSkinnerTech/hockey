import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { RootStackScreenProps } from '../types/navigation';
import { Button } from '../components/ui';
import { Colors, getThemeColors } from '../theme/colors';
import { Layout, Typography, Spacing, Shadows } from '../theme/spacing';
import { storage, StorageKeys } from '../lib/storage/mmkv-setup';

type Props = RootStackScreenProps<'Home'>;

interface Shot {
  id: string;
  timestamp: number;
  thumbnailUri?: string;
  accuracy?: number;
}

interface Stats {
  totalShots: number;
  bestAccuracy: number;
  sessionsCount: number;
  lastSessionDate?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHOT_THUMBNAIL_SIZE = (SCREEN_WIDTH - Spacing.lg * 3) / 2;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const colorScheme = useColorScheme();
  const colors = getThemeColors(colorScheme === 'dark');
  const [recentShots, setRecentShots] = useState<Shot[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalShots: 0,
    bestAccuracy: 0,
    sessionsCount: 0,
  });

  // Load cached data
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = () => {
    // Load recent shots
    const cachedShots = storage.get<Shot[]>('recent_shots') || [];
    setRecentShots(cachedShots.slice(0, 5)); // Last 5 shots

    // Load stats
    const cachedStats = storage.get<Stats>('user_stats') || {
      totalShots: 0,
      bestAccuracy: 0,
      sessionsCount: 0,
    };
    setStats(cachedStats);
  };

  const handleStartRecording = useCallback(() => {
    navigation.navigate('Recording');
  }, [navigation]);

  const handleShotPress = useCallback(
    (shot: Shot) => {
      // Navigate to analysis with shot data
      navigation.navigate('Analysis', {
        shotId: shot.id,
        videoUri: shot.thumbnailUri || '', // In real app, this would be video URI
      });
    },
    [navigation],
  );

  const renderShotItem = ({ item }: { item: Shot }) => (
    <Button
      variant="ghost"
      onPress={() => handleShotPress(item)}
      style={[styles.shotCard, { backgroundColor: colors.background.secondary }]}
    >
      <View style={styles.shotContent}>
        {item.thumbnailUri ? (
          <Image
            source={{ uri: item.thumbnailUri }}
            style={styles.shotThumbnail}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.shotPlaceholder, { backgroundColor: colors.neutral[200] }]}>
            <Text style={{ color: colors.text.tertiary }}>No preview</Text>
          </View>
        )}
        <View style={styles.shotInfo}>
          <Text style={[styles.shotDate, { color: colors.text.secondary }]}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
          {item.accuracy && (
            <Text style={[styles.shotAccuracy, { color: colors.success[500] }]}>
              {item.accuracy}% accuracy
            </Text>
          )}
        </View>
      </View>
    </Button>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text.primary }]}>Smart Hockey Coach</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Improve your shot with AI analysis
          </Text>
        </View>

        {/* Hero CTA */}
        <View style={styles.heroSection}>
          <Button
            variant="primary"
            size="large"
            onPress={handleStartRecording}
            fullWidth
            style={styles.recordButton}
          >
            Start Recording
          </Button>
        </View>

        {/* Quick Stats */}
        <View style={[styles.statsContainer, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary[500] }]}>
              {stats.totalShots}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Total Shots</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border.light }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success[500] }]}>
              {stats.bestAccuracy}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Best Accuracy</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border.light }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info[500] }]}>
              {stats.sessionsCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Sessions</Text>
          </View>
        </View>

        {/* Recent Shots */}
        {recentShots.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Recent Shots</Text>
            <View style={styles.shotsContainer}>
              <FlashList
                data={recentShots}
                renderItem={renderShotItem}
                estimatedItemSize={SHOT_THUMBNAIL_SIZE + 60}
                horizontal
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
              />
            </View>
          </View>
        )}

        {/* Empty State */}
        {recentShots.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No shots recorded yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
              Start recording to analyze your hockey shots
            </Text>
          </View>
        )}
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.displayLarge,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.regular,
  },
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  recordButton: {
    height: Layout.buttonHeightLarge + 8,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xxs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
  },
  statDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: Spacing.md,
  },
  recentSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  shotsContainer: {
    height: SHOT_THUMBNAIL_SIZE + 80,
    paddingLeft: Spacing.lg,
  },
  shotCard: {
    width: SHOT_THUMBNAIL_SIZE,
    padding: 0,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
  },
  shotContent: {
    width: '100%',
  },
  shotThumbnail: {
    width: SHOT_THUMBNAIL_SIZE,
    height: SHOT_THUMBNAIL_SIZE,
  },
  shotPlaceholder: {
    width: SHOT_THUMBNAIL_SIZE,
    height: SHOT_THUMBNAIL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotInfo: {
    padding: Spacing.sm,
  },
  shotDate: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular,
  },
  shotAccuracy: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginTop: Spacing.xxs,
  },
  emptyState: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    textAlign: 'center',
  },
});

export default React.memo(HomeScreen);
