import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import GlowingOrb from "@/components/GlowingOrb";
import MessageBubble from "@/components/MessageBubble";
import TypingIndicator from "@/components/TypingIndicator";
import ChatInput from "@/components/ChatInput";
import VoiceFAB from "@/components/VoiceFAB";
import { Message } from "@/context/AppContext";

const PROVIDER_LABELS = {
  gemini: "Gemini",
  openai: "OpenAI",
  openrouter: "OpenRouter",
} as const;

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const {
    messages,
    isListening,
    isSpeaking,
    isStreaming,
    showTyping,
    backgroundListening,
    setBackgroundListening,
    deleteHistory,
    sendMessage,
    setIsListening,
    activeProvider,
    apiKeys,
    stopSpeaking,
  } = useApp();

  const reversedMessages = [...messages].reverse();

  const handleVoicePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsListening(!isListening);
  };

  const handleDeleteHistory = () => {
    if (Platform.OS === "web") {
      deleteHistory();
      return;
    }
    Alert.alert(
      "Delete History",
      "This will permanently erase all conversations. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            deleteHistory();
          },
        },
      ]
    );
  };

  const hasMessages = messages.length > 0;
  const currentKey = apiKeys[activeProvider];
  const hasKey = !!currentKey;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: Colors.dark.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8) },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>JARVIS</Text>
          <View
            style={[
              styles.providerBadge,
              hasKey && styles.providerBadgeActive,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                hasKey ? styles.statusDotActive : styles.statusDotInactive,
              ]}
            />
            <Text
              style={[
                styles.providerText,
                hasKey ? styles.providerTextActive : styles.providerTextInactive,
              ]}
            >
              {PROVIDER_LABELS[activeProvider]}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {hasMessages && (
            <Pressable
              onPress={handleDeleteHistory}
              style={({ pressed }) => [
                styles.headerBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Feather name="trash-2" size={18} color={Colors.dark.error} />
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push("/settings")}
            style={({ pressed }) => [
              styles.headerBtn,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Feather name="settings" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* Listening toggle */}
      <View style={styles.toggleRow}>
        <Feather
          name="radio"
          size={13}
          color={
            backgroundListening ? Colors.dark.tint : Colors.dark.textMuted
          }
        />
        <Text
          style={[
            styles.toggleLabel,
            backgroundListening && styles.toggleLabelActive,
          ]}
        >
          Always On
        </Text>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setBackgroundListening(!backgroundListening);
          }}
          style={[
            styles.toggleSwitch,
            backgroundListening && styles.toggleSwitchActive,
          ]}
        >
          <View
            style={[
              styles.toggleKnob,
              backgroundListening && styles.toggleKnobActive,
            ]}
          />
        </Pressable>
      </View>

      {/* Chat or Orb */}
      {!hasMessages ? (
        <View style={styles.orbContainer}>
          <GlowingOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
            size={140}
          />
          <Text style={styles.orbLabel}>
            {isSpeaking
              ? "Speaking..."
              : isListening
              ? "Listening..."
              : "Hello, I am Jarvis"}
          </Text>
          <Text style={styles.orbSub}>
            {!hasKey
              ? `Add a ${PROVIDER_LABELS[activeProvider]} API key in Settings to get started`
              : "Type a message or tap the mic to speak"}
          </Text>
          {isSpeaking && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                stopSpeaking();
              }}
              style={({ pressed }) => [
                styles.stopButton,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Feather name="square" size={14} color={Colors.dark.background} />
              <Text style={styles.stopButtonText}>Stop Speaking</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={reversedMessages}
            keyExtractor={(item: Message) => item.id}
            renderItem={({ item }: { item: Message }) => (
              <MessageBubble message={item} />
            )}
            inverted
            ListHeaderComponent={showTyping ? <TypingIndicator /> : null}
            contentContainerStyle={styles.messageList}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
          {/* Mini orb when speaking + has messages */}
          {isSpeaking && (
            <Pressable
              onPress={stopSpeaking}
              style={styles.speakingBanner}
            >
              <View style={styles.speakingDot} />
              <Text style={styles.speakingText}>Speaking — tap to stop</Text>
              <Feather name="square" size={14} color={Colors.dark.tint} />
            </Pressable>
          )}
        </View>
      )}

      {/* Bottom input area */}
      <View style={styles.bottomArea}>
        <View style={styles.inputArea}>
          {/* Voice FAB — floating style */}
          <View style={styles.fabContainer}>
            <VoiceFAB isListening={isListening} onPress={handleVoicePress} />
          </View>
          <View style={styles.inputWrapper}>
            <ChatInput onSend={sendMessage} disabled={isStreaming} />
          </View>
        </View>
        <View
          style={{
            height:
              Platform.OS === "web"
                ? 34
                : insets.bottom,
          }}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.tint,
    letterSpacing: 4,
  },
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  providerBadgeActive: {
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotActive: {
    backgroundColor: Colors.dark.success,
  },
  statusDotInactive: {
    backgroundColor: Colors.dark.textMuted,
  },
  providerText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  providerTextActive: {
    color: Colors.dark.textSecondary,
  },
  providerTextInactive: {
    color: Colors.dark.textMuted,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  headerBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textMuted,
    flex: 1,
  },
  toggleLabelActive: {
    color: Colors.dark.tint,
  },
  toggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.dark.border,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: "rgba(0, 212, 255, 0.3)",
    borderColor: Colors.dark.tint,
    borderWidth: 1,
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.dark.textMuted,
  },
  toggleKnobActive: {
    backgroundColor: Colors.dark.tint,
    alignSelf: "flex-end",
  },
  orbContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  orbLabel: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    textAlign: "center",
  },
  orbSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.dark.tint,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  stopButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.background,
  },
  speakingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(0, 212, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.25)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  speakingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.tint,
  },
  speakingText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.tint,
  },
  messageList: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  bottomArea: {
    borderTopWidth: 0,
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 12,
    paddingRight: 0,
    paddingVertical: 8,
    gap: 0,
  },
  fabContainer: {
    paddingBottom: 14,
    paddingRight: 4,
  },
  inputWrapper: {
    flex: 1,
  },
});
