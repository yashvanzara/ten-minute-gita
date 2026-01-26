import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useProgress } from '@/hooks/useProgress';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

const MILESTONE_EMOJIS: { [key: number]: string } = {
  1: '🌱',
  3: '🌿',
  7: '🌴',
  10: '🌳',
  30: '⭐',
  60: '🌟',
  120: '💫',
  239: '🏆',
};

const MILESTONE_LABELS: { [key: number]: string } = {
  1: 'First Day',
  3: '3 Days',
  7: 'One Week',
  10: '10 Days',
  30: 'One Month',
  60: '60 Days',
  120: '120 Days',
  239: 'Complete Journey',
};

export function MilestoneCard() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const { milestones, completedCount } = useProgress();
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter milestones based on progress:
  // - Always show: 1, 3, 7, 10
  // - Show 30 after reaching 10 days
  // - Show 60, 120, 239 after reaching 30 days
  const filteredMilestones = milestones.filter(m => {
    if (m.days <= 10) return true;
    if (m.days === 30) return completedCount >= 10;
    return completedCount >= 30;
  });

  // Show all milestones when expanded, filtered when collapsed
  const displayMilestones = isExpanded ? milestones : filteredMilestones;
  const hasHiddenMilestones = filteredMilestones.length < milestones.length;

  // Find the next unachieved milestone
  const nextMilestone = displayMilestones.find(m => !m.achieved);

  // Calculate "to go" for each milestone (all based on total completed days)
  const getToGoText = (days: number, achieved: boolean): string => {
    if (achieved) return 'Achieved!';
    const remaining = days - completedCount;
    return remaining === 1 ? '1 day to go' : `${remaining} days to go`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Milestones</Text>
        {hasHiddenMilestones && (
          <Pressable onPress={() => setIsExpanded(!isExpanded)} hitSlop={8}>
            <Text style={[styles.expandButton, { color: colors.accent }]}>
              {isExpanded ? 'Show less' : 'See all'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.milestonesGrid}>
        {displayMilestones.map(({ days, achieved }) => {
          const isNext = nextMilestone?.days === days;

          return (
            <View
              key={days}
              style={[
                styles.milestone,
                {
                  backgroundColor: achieved
                    ? colorScheme === 'dark' ? '#2D5A3D' : '#E8F5E9'
                    : isNext
                    ? colorScheme === 'dark' ? '#3D3D2D' : '#FFF8E1'
                    : colorScheme === 'dark' ? '#404040' : '#F5F5F5',
                },
                isNext && [styles.nextMilestone, { borderColor: colors.accent }],
              ]}
            >
              {achieved && (
                <View style={styles.achievedBadge}>
                  <Text style={styles.achievedCheck}>✓</Text>
                </View>
              )}
              <Text style={styles.emoji}>{MILESTONE_EMOJIS[days]}</Text>
              <Text
                style={[
                  styles.milestoneLabel,
                  { color: achieved ? '#4CAF50' : colors.text },
                ]}
              >
                {MILESTONE_LABELS[days]}
              </Text>
              <Text
                style={[
                  styles.milestoneDays,
                  {
                    color: achieved
                      ? '#4CAF50'
                      : isNext
                      ? colors.accent
                      : colors.textSecondary,
                    fontWeight: isNext ? '600' : '400',
                  },
                ]}
              >
                {getToGoText(days, achieved)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  milestone: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  nextMilestone: {
    borderWidth: 2,
  },
  achievedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievedCheck: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  milestoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  milestoneDays: {
    fontSize: 12,
    marginTop: 4,
  },
});
