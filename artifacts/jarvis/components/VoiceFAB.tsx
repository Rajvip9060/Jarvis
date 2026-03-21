import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Platform,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface VoiceFABProps {
  isListening: boolean;
  onPress: () => void;
}

export default function VoiceFAB({ isListening, onPress }: VoiceFABProps) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    if (isListening) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        true
      );
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      glowOpacity.value = withTiming(0.4, { duration: 400 });
      glowScale.value = withTiming(1, { duration: 400 });
    }
  }, [isListening, glowOpacity, glowScale]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.88, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Pressable onPress={handlePress}>
        <Animated.View
          style={[
            styles.fab,
            isListening && styles.fabActive,
            fabStyle,
          ]}
        >
          <Feather
            name={isListening ? "mic" : "mic"}
            size={24}
            color={isListening ? Colors.dark.background : Colors.dark.tint}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    height: 64,
  },
  glow: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 212, 255, 0.3)",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 212, 255, 0.1)",
    borderWidth: 1.5,
    borderColor: Colors.dark.tint,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
  fabActive: {
    backgroundColor: Colors.dark.tint,
  },
});
