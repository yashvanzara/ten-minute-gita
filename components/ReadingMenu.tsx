import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TextSizeControl } from '@/components/TextSizeControl';
import { LanguageToggle } from '@/components/LanguageToggle';
import Colors from '@/constants/Colors';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';

export function ReadingMenu() {
  const colorScheme = useAppColorScheme();
  const colors = Colors[colorScheme];
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const open = () => {
    setVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const close = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  return (
    <>
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={open}
        style={styles.trigger}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Reading options menu"
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
      >
        <TouchableWithoutFeedback onPress={close}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menu,
                  {
                    backgroundColor: colors.card,
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    }],
                    shadowColor: '#000',
                  },
                ]}
              >
                {/* Text Size */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Text Size
                  </Text>
                  <TextSizeControl />
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* Language */}
                <View style={styles.section}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    Language
                  </Text>
                  <LanguageToggle />
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 12,
    marginRight: -8,
  },
  backdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 54,
    paddingRight: 16,
  },
  menu: {
    borderRadius: 14,
    padding: 16,
    minWidth: 200,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
