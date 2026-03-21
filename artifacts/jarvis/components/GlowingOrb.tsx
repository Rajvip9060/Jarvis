import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

interface GlowingOrbProps {
  isListening?: boolean;
  isSpeaking?: boolean;
  size?: number;
}

function OrbRing({
  delay,
  isActive,
  orbSize,
}: {
  delay: number;
  isActive: boolean;
  orbSize: number;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 0 }),
          withTiming(1.8 + delay * 0.3, { duration: 1200 + delay * 200 })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 0 }),
          withTiming(0, { duration: 1200 + delay * 200 })
        ),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 600 });
      opacity.value = withTiming(0, { duration: 600 });
    }
  }, [isActive, delay, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: orbSize,
          height: orbSize,
          borderRadius: orbSize / 2,
          borderColor: Colors.dark.tint,
        },
        animStyle,
      ]}
    />
  );
}

function OrbCore({ isActive, orbSize }: { isActive: boolean; orbSize: number }) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.7);

  useEffect(() => {
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 400 }),
          withTiming(0.94, { duration: 400 })
        ),
        -1,
        true
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.7, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 2000 }),
          withTiming(0.97, { duration: 2000 })
        ),
        -1,
        true
      );
      glow.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 2000 }),
          withTiming(0.55, { duration: 2000 })
        ),
        -1,
        true
      );
    }
  }, [isActive, pulse, glow]);

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: glow.value,
  }));

  const innerSize = orbSize * 0.65;
  const coreSize = orbSize * 0.38;

  return (
    <Animated.View style={[coreStyle]}>
      <View
        style={[
          styles.orbOuter,
          {
            width: orbSize,
            height: orbSize,
            borderRadius: orbSize / 2,
          },
        ]}
      >
        <View
          style={[
            styles.orbInner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        >
          <View
            style={[
              styles.orbCore,
              {
                width: coreSize,
                height: coreSize,
                borderRadius: coreSize / 2,
              },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function GlowingOrb({
  isListening = false,
  isSpeaking = false,
  size = 160,
}: GlowingOrbProps) {
  const isActive = isListening || isSpeaking;

  return (
    <View style={[styles.container, { width: size * 2.2, height: size * 2.2 }]}>
      <OrbRing delay={0} isActive={isActive} orbSize={size} />
      <OrbRing delay={1} isActive={isActive} orbSize={size} />
      <OrbRing delay={2} isActive={isActive} orbSize={size} />
      <OrbCore isActive={isActive} orbSize={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    borderWidth: 1.5,
  },
  orbOuter: {
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  orbInner: {
    backgroundColor: "rgba(0, 180, 220, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  orbCore: {
    backgroundColor: "#00D4FF",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 30,
  },
});
