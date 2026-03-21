import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

function Dot({ delayMs }: { delayMs: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 350 }),
          withTiming(0, { duration: 350 })
        ),
        -1,
        false
      )
    );
  }, [delayMs, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

export default function TypingIndicator() {
  return (
    <View style={styles.container}>
      <View style={styles.aiBadge}>
        <View style={styles.aiBadgeDot} />
      </View>
      <View style={styles.bubble}>
        <Dot delayMs={0} />
        <Dot delayMs={150} />
        <Dot delayMs={300} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  aiBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 212, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tint,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.tint,
  },
});
