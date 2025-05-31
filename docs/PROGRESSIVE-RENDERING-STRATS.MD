# Progressive Rendering Strategies - Smart Hockey Coach

## Overview

Progressive rendering ensures users see feedback as soon as it's available, creating a perception of speed even when full analysis takes 10-15 seconds. This document covers React Native implementation strategies for smooth, progressive UI updates.

## State Management Architecture

### Zustand Store Structure
```typescript
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface FeedbackState {
  // Instant feedback (on-device)
  instantFeedback: {
    message: string;
    confidence: number;
    timestamp: number;
  } | null;
  
  // Fast feedback (Gemini quick analysis)
  fastFeedback: {
    raw: string;
    parsed: {
      outcome: string | null;
      shotType: string | null;
      confidence: string | null;
    };
    isLoading: boolean;
    error: string | null;
  };
  
  // Full feedback (Gemini detailed analysis)
  fullFeedback: {
    raw: string;
    sections: {
      outcome: string | null;
      trajectory: string | null;
      positivePoints: string[] | null;
      improvements: ImprovementArea[] | null;
      biomechanics: BiomechanicsData | null;
      release: ReleaseData | null;
      summary: string | null;
    };
    loadingStates: {
      outcome: boolean;
      trajectory: boolean;
      positivePoints: boolean;
      improvements: boolean;
      biomechanics: boolean;
      release: boolean;
      summary: boolean;
    };
    error: string | null;
  };
  
  // Actions
  actions: {
    setInstantFeedback: (feedback: InstantFeedback) => void;
    appendFastFeedbackChunk: (chunk: string) => void;
    appendFullFeedbackChunk: (chunk: string) => void;
    resetFeedback: () => void;
  };
}

export const useFeedbackStore = create<FeedbackState>()(
  subscribeWithSelector((set, get) => ({
    instantFeedback: null,
    fastFeedback: {
      raw: '',
      parsed: { outcome: null, shotType: null, confidence: null },
      isLoading: false,
      error: null,
    },
    fullFeedback: {
      raw: '',
      sections: {
        outcome: null,
        trajectory: null,
        positivePoints: null,
        improvements: null,
        biomechanics: null,
        release: null,
        summary: null,
      },
      loadingStates: {
        outcome: true,
        trajectory: true,
        positivePoints: true,
        improvements: true,
        biomechanics: true,
        release: true,
        summary: true,
      },
      error: null,
    },
    
    actions: {
      setInstantFeedback: (feedback) => set({ instantFeedback: feedback }),
      
      appendFastFeedbackChunk: (chunk) => set((state) => {
        const newRaw = state.fastFeedback.raw + chunk;
        const parsed = tryParseFastFeedback(newRaw);
        
        return {
          fastFeedback: {
            ...state.fastFeedback,
            raw: newRaw,
            parsed: parsed || state.fastFeedback.parsed,
            isLoading: !parsed?.outcome,
          }
        };
      }),
      
      appendFullFeedbackChunk: (chunk) => set((state) => {
        const newRaw = state.fullFeedback.raw + chunk;
        const sections = progressivelyParseFullFeedback(newRaw);
        const loadingStates = updateLoadingStates(sections);
        
        return {
          fullFeedback: {
            ...state.fullFeedback,
            raw: newRaw,
            sections,
            loadingStates,
          }
        };
      }),
      
      resetFeedback: () => set({
        instantFeedback: null,
        fastFeedback: { raw: '', parsed: {}, isLoading: false, error: null },
        fullFeedback: { raw: '', sections: {}, loadingStates: {}, error: null },
      }),
    },
  }))
);
```

## Streaming Data Handlers

### Convex Subscription Handler
```typescript
import { useQuery, useSubscription } from 'convex/react';
import { api } from '../convex/_generated/api';

export const useShotFeedback = (shotId: string) => {
  const { appendFastFeedbackChunk, appendFullFeedbackChunk } = 
    useFeedbackStore((state) => state.actions);
  
  // Subscribe to shot updates
  const shotData = useQuery(api.shots.getWithStreaming, { shotId });
  
  // Handle fast feedback streaming
  useEffect(() => {
    if (shotData?.streamingData?.fastFeedbackChunk) {
      appendFastFeedbackChunk(shotData.streamingData.fastFeedbackChunk);
    }
  }, [shotData?.streamingData?.fastFeedbackChunk]);
  
  // Handle full feedback streaming
  useEffect(() => {
    if (shotData?.streamingData?.fullFeedbackChunk) {
      appendFullFeedbackChunk(shotData.streamingData.fullFeedbackChunk);
    }
  }, [shotData?.streamingData?.fullFeedbackChunk]);
  
  return shotData;
};
```

### Progressive JSON Parsing
```typescript
// Fast feedback parser - simple structure
function tryParseFastFeedback(raw: string): FastFeedbackParsed | null {
  try {
    const parsed = JSON.parse(raw);
    return {
      outcome: parsed.shot_outcome_fast || null,
      shotType: parsed.shot_type_detected_fast || null,
      confidence: parsed.confidence_level || null,
    };
  } catch (e) {
    // Try regex extraction for partial data
    const outcomeMatch = raw.match(/"shot_outcome_fast":\s*"([^"]+)"/);
    const typeMatch = raw.match(/"shot_type_detected_fast":\s*"([^"]+)"/);
    
    if (outcomeMatch || typeMatch) {
      return {
        outcome: outcomeMatch?.[1] || null,
        shotType: typeMatch?.[1] || null,
        confidence: null,
      };
    }
    
    return null;
  }
}

// Full feedback parser - complex nested structure
function progressivelyParseFullFeedback(raw: string): FullFeedbackSections {
  const sections: FullFeedbackSections = {
    outcome: null,
    trajectory: null,
    positivePoints: null,
    improvements: null,
    biomechanics: null,
    release: null,
    summary: null,
  };
  
  // Try full parse first
  try {
    const parsed = JSON.parse(raw);
    return {
      outcome: parsed.shot_outcome_full,
      trajectory: parsed.puck_trajectory_description,
      positivePoints: parsed.key_positive_points,
      improvements: parsed.areas_for_improvement,
      biomechanics: parsed.biomechanics_analysis,
      release: parsed.release_details,
      summary: parsed.overall_summary_and_encouragement,
    };
  } catch (e) {
    // Progressive extraction using regex and string manipulation
    
    // Extract simple string fields
    const outcomeMatch = raw.match(/"shot_outcome_full":\s*"([^"]+)"/);
    if (outcomeMatch) sections.outcome = outcomeMatch[1];
    
    const trajectoryMatch = raw.match(/"puck_trajectory_description":\s*"([^"]+)"/);
    if (trajectoryMatch) sections.trajectory = trajectoryMatch[1];
    
    // Extract arrays
    const positivePointsMatch = raw.match(/"key_positive_points":\s*\[(.*?)\]/s);
    if (positivePointsMatch) {
      try {
        sections.positivePoints = JSON.parse(`[${positivePointsMatch[1]}]`);
      } catch {}
    }
    
    // Extract nested objects
    const biomechanicsMatch = raw.match(/"biomechanics_analysis":\s*\{(.*?)\}/s);
    if (biomechanicsMatch) {
      try {
        sections.biomechanics = JSON.parse(`{${biomechanicsMatch[1]}}`);
      } catch {}
    }
    
    // Extract summary (often last)
    const summaryMatch = raw.match(/"overall_summary_and_encouragement":\s*"([^"]+)"/);
    if (summaryMatch) sections.summary = summaryMatch[1];
  }
  
  return sections;
}
```

## UI Components

### Progressive Feedback Display
```typescript
import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  useAnimatedStyle, 
  withSpring 
} from 'react-native-reanimated';
import { Skeleton } from '@rneui/themed';

export const ShotAnalysisScreen: React.FC<{ shotId: string }> = ({ shotId }) => {
  const instantFeedback = useFeedbackStore((state) => state.instantFeedback);
  const fastFeedback = useFeedbackStore((state) => state.fastFeedback);
  const fullFeedback = useFeedbackStore((state) => state.fullFeedback);
  
  useShotFeedback(shotId); // Sets up subscriptions
  
  return (
    <ScrollView style={styles.container}>
      {/* Instant Feedback - Appears immediately */}
      {instantFeedback && (
        <Animated.View entering={FadeIn.duration(300)}>
          <InstantFeedbackCard feedback={instantFeedback} />
        </Animated.View>
      )}
      
      {/* Fast Feedback - Appears within 3 seconds */}
      <FastFeedbackSection feedback={fastFeedback} />
      
      {/* Full Feedback - Progressive sections */}
      <FullFeedbackSection feedback={fullFeedback} />
    </ScrollView>
  );
};

// Fast feedback component with skeleton loading
const FastFeedbackSection: React.FC<{ feedback: FastFeedbackState }> = ({ 
  feedback 
}) => {
  const { parsed, isLoading } = feedback;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Analysis</Text>
      
      {/* Outcome */}
      <View style={styles.row}>
        <Text style={styles.label}>Outcome:</Text>
        {isLoading && !parsed.outcome ? (
          <Skeleton width={100} height={20} />
        ) : (
          <Animated.View entering={SlideInDown.duration(400)}>
            <Text style={styles.value}>{parsed.outcome}</Text>
          </Animated.View>
        )}
      </View>
      
      {/* Shot Type */}
      <View style={styles.row}>
        <Text style={styles.label}>Shot Type:</Text>
        {isLoading && !parsed.shotType ? (
          <Skeleton width={120} height={20} />
        ) : (
          <Animated.View entering={SlideInDown.duration(400).delay(100)}>
            <Text style={styles.value}>{parsed.shotType}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

// Full feedback with progressive section rendering
const FullFeedbackSection: React.FC<{ feedback: FullFeedbackState }> = ({ 
  feedback 
}) => {
  const { sections, loadingStates } = feedback;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Detailed Analysis</Text>
      
      {/* Trajectory Description */}
      <AnimatedSection
        title="Puck Trajectory"
        content={sections.trajectory}
        isLoading={loadingStates.trajectory}
        delay={0}
      />
      
      {/* Positive Points */}
      {(loadingStates.positivePoints || sections.positivePoints) && (
        <Animated.View entering={FadeIn.duration(500).delay(200)}>
          <Text style={styles.subsectionTitle}>What You Did Well</Text>
          {loadingStates.positivePoints && !sections.positivePoints ? (
            <View>
              <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
              <Skeleton width="85%" height={16} />
            </View>
          ) : (
            sections.positivePoints?.map((point, index) => (
              <Animated.View
                key={index}
                entering={SlideInDown.duration(300).delay(index * 100)}
              >
                <Text style={styles.bulletPoint}>• {point}</Text>
              </Animated.View>
            ))
          )}
        </Animated.View>
      )}
      
      {/* Areas for Improvement */}
      {(loadingStates.improvements || sections.improvements) && (
        <ImprovementsList
          improvements={sections.improvements}
          isLoading={loadingStates.improvements}
        />
      )}
      
      {/* Biomechanics Analysis */}
      {(loadingStates.biomechanics || sections.biomechanics) && (
        <BiomechanicsCard
          data={sections.biomechanics}
          isLoading={loadingStates.biomechanics}
        />
      )}
      
      {/* Summary */}
      <AnimatedSection
        title="Coach's Summary"
        content={sections.summary}
        isLoading={loadingStates.summary}
        delay={600}
        style={styles.summaryBox}
      />
    </View>
  );
};
```

### Animated Components
```typescript
// Reusable animated section component
const AnimatedSection: React.FC<{
  title: string;
  content: string | null;
  isLoading: boolean;
  delay?: number;
  style?: any;
}> = ({ title, content, isLoading, delay = 0, style }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(content ? 1 : 0.3),
      transform: [
        {
          translateY: withSpring(content ? 0 : 10),
        },
      ],
    };
  });
  
  if (!isLoading && !content) return null;
  
  return (
    <Animated.View
      entering={FadeIn.duration(500).delay(delay)}
      style={[animatedStyle, style]}
    >
      <Text style={styles.subsectionTitle}>{title}</Text>
      {isLoading && !content ? (
        <Skeleton width="95%" height={60} />
      ) : (
        <Text style={styles.content}>{content}</Text>
      )}
    </Animated.View>
  );
};

// Improvements list with staggered animation
const ImprovementsList: React.FC<{
  improvements: ImprovementArea[] | null;
  isLoading: boolean;
}> = ({ improvements, isLoading }) => {
  if (!isLoading && !improvements) return null;
  
  return (
    <Animated.View entering={FadeIn.duration(500).delay(300)}>
      <Text style={styles.subsectionTitle}>Areas to Improve</Text>
      
      {isLoading && !improvements ? (
        <View>
          {[1, 2].map((i) => (
            <View key={i} style={styles.improvementCard}>
              <Skeleton width="40%" height={18} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
              <Skeleton width="95%" height={14} />
            </View>
          ))}
        </View>
      ) : (
        improvements?.map((item, index) => (
          <Animated.View
            key={index}
            entering={SlideInDown.duration(400)
              .delay(300 + index * 150)
              .springify()}
            style={styles.improvementCard}
          >
            <Text style={styles.improvementAspect}>{item.aspect}</Text>
            <Text style={styles.improvementObservation}>{item.observation}</Text>
            <Text style={styles.improvementSuggestion}>{item.suggestion}</Text>
            {item.drill_suggestion_short && (
              <View style={styles.drillBox}>
                <Text style={styles.drillLabel}>Try this drill:</Text>
                <Text style={styles.drillText}>{item.drill_suggestion_short}</Text>
              </View>
            )}
          </Animated.View>
        ))
      )}
    </Animated.View>
  );
};
```

### Skeleton Loading Patterns
```typescript
// Custom skeleton components for different content types
export const FeedbackSkeletons = {
  // Single line skeleton
  Line: ({ width = '100%' }) => (
    <Skeleton
      animation="pulse"
      width={width}
      height={16}
      style={styles.skeletonLine}
    />
  ),
  
  // Paragraph skeleton
  Paragraph: ({ lines = 3 }) => (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          animation="pulse"
          width={i === lines - 1 ? '80%' : '100%'}
          height={14}
          style={styles.skeletonLine}
        />
      ))}
    </View>
  ),
  
  // Card skeleton
  Card: () => (
    <View style={styles.skeletonCard}>
      <Skeleton width="60%" height={20} style={{ marginBottom: 12 }} />
      <FeedbackSkeletons.Paragraph lines={3} />
    </View>
  ),
  
  // List skeleton
  List: ({ items = 3 }) => (
    <View>
      {Array.from({ length: items }).map((_, i) => (
        <View key={i} style={styles.skeletonListItem}>
          <Skeleton circle width={8} height={8} style={{ marginRight: 8 }} />
          <Skeleton width="90%" height={16} />
        </View>
      ))}
    </View>
  ),
};
```

## Performance Optimizations

### Memoization and Optimization
```typescript
import { memo, useMemo, useCallback } from 'react';
import { InteractionManager } from 'react-native';

// Memoized feedback components
export const MemoizedFeedbackSection = memo(
  FullFeedbackSection,
  (prevProps, nextProps) => {
    // Only re-render if sections actually changed
    return JSON.stringify(prevProps.feedback.sections) === 
           JSON.stringify(nextProps.feedback.sections);
  }
);

// Defer heavy rendering
export const DeferredBiomechanicsCard = ({ data, isLoading }) => {
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    // Defer rendering until after interactions
    const task = InteractionManager.runAfterInteractions(() => {
      setShouldRender(true);
    });
    
    return () => task.cancel();
  }, []);
  
  if (!shouldRender) {
    return <FeedbackSkeletons.Card />;
  }
  
  return <BiomechanicsCard data={data} isLoading={isLoading} />;
};

// Virtualized list for many feedback items
import { FlashList } from '@shopify/flash-list';

export const VirtualizedImprovementsList = ({ improvements }) => {
  const renderItem = useCallback(({ item, index }) => (
    <Animated.View
      entering={SlideInDown.duration(400)
        .delay(Math.min(index * 100, 500))}
    >
      <ImprovementCard item={item} />
    </Animated.View>
  ), []);
  
  return (
    <FlashList
      data={improvements}
      renderItem={renderItem}
      estimatedItemSize={120}
      scrollEnabled={false}
    />
  );
};
```

### Streaming Text Animation
```typescript
// Animated text that reveals character by character
export const StreamingText: React.FC<{
  text: string;
  speed?: number;
}> = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');
  const animationRef = useRef<number>();
  
  useEffect(() => {
    let currentIndex = 0;
    
    const animate = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start animation after a frame
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, speed]);
  
  return <Text style={styles.streamingText}>{displayedText}</Text>;
};
```

## Error States and Fallbacks

### Error Handling UI
```typescript
export const FeedbackErrorBoundary: React.FC<{ children: ReactNode }> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={FeedbackErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Feedback rendering error:', error, errorInfo);
        analytics.track('feedback_render_error', { error: error.toString() });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

const FeedbackErrorFallback = ({ error, resetError }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
    <Text style={styles.errorMessage}>
      We couldn't display your shot analysis properly.
    </Text>
    <TouchableOpacity style={styles.retryButton} onPress={resetError}>
      <Text style={styles.retryButtonText}>Try Again</Text>
    </TouchableOpacity>
  </View>
);

// Partial feedback fallback
export const PartialFeedbackDisplay = ({ availableData }) => (
  <View style={styles.partialContainer}>
    <Text style={styles.partialTitle}>
      Analysis in Progress...
    </Text>
    <Text style={styles.partialMessage}>
      Here's what we've analyzed so far:
    </Text>
    {/* Display whatever data is available */}
    {availableData.outcome && (
      <Text>Shot Outcome: {availableData.outcome}</Text>
    )}
    {/* ... other available fields */}
  </View>
);
```

## Best Practices Summary

1. **Start Fast**: Show instant feedback within 500ms using on-device ML
2. **Stream Everything**: Use streaming for both fast and full feedback
3. **Parse Progressively**: Extract partial data even from incomplete JSON
4. **Animate Thoughtfully**: Use subtle animations to draw attention to new content
5. **Defer Heavy Rendering**: Use InteractionManager for complex components
6. **Handle Errors Gracefully**: Always have fallbacks for partial or failed data
7. **Optimize Re-renders**: Use memoization and selective subscriptions
8. **Test on Low-End Devices**: Ensure smooth performance on older phones