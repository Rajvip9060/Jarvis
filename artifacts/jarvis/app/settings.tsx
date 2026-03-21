import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";

import Colors from "@/constants/colors";
import { useApp, ApiKeys, AIProvider } from "@/context/AppContext";

const PROVIDERS: { key: AIProvider; label: string; hint: string }[] = [
  {
    key: "gemini",
    label: "Google Gemini",
    hint: "Get key from aistudio.google.com",
  },
  {
    key: "openai",
    label: "OpenAI",
    hint: "Get key from platform.openai.com",
  },
  {
    key: "openrouter",
    label: "OpenRouter",
    hint: "Get key from openrouter.ai",
  },
];

function ApiKeyField({
  label,
  hint,
  value,
  onChange,
  isActive,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  isActive: boolean;
}) {
  const [show, setShow] = useState(false);
  const hasValue = value.trim().length > 0;

  return (
    <View style={[styles.keyCard, isActive && styles.keyCardActive]}>
      <View style={styles.keyHeader}>
        <Text style={styles.keyLabel}>{label}</Text>
        {hasValue && (
          <View style={styles.keySetBadge}>
            <Feather name="check" size={10} color={Colors.dark.success} />
            <Text style={styles.keySetText}>Set</Text>
          </View>
        )}
      </View>
      <Text style={styles.keyHint}>{hint}</Text>
      <View style={styles.keyInputRow}>
        <TextInput
          style={styles.keyInput}
          value={value}
          onChangeText={onChange}
          placeholder="sk-... or your API key"
          placeholderTextColor={Colors.dark.textMuted}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          onPress={() => setShow((s) => !s)}
          style={styles.eyeButton}
        >
          <Feather
            name={show ? "eye-off" : "eye"}
            size={16}
            color={Colors.dark.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    apiKeys,
    saveApiKeys,
    activeProvider,
    setActiveProvider,
    ttsEnabled,
    setTtsEnabled,
    deleteHistory,
    messages,
  } = useApp();
  const [keys, setKeys] = useState<ApiKeys>({ ...apiKeys });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSaving(true);
    try {
      await saveApiKeys(keys);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClearChat = () => {
    const doDelete = () => {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      deleteHistory();
    };

    if (Platform.OS === "web") {
      doDelete();
      return;
    }
    Alert.alert(
      "Clear Chat History",
      "This will permanently erase all conversations. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: doDelete },
      ]
    );
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: Colors.dark.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Feather name="arrow-left" size={20} color={Colors.dark.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        bottomOffset={20}
        keyboardShouldPersistTaps="handled"
      >
        {/* Active Provider */}
        <Text style={styles.sectionTitle}>Active Provider</Text>
        <View style={styles.providerRow}>
          {PROVIDERS.map((p) => (
            <Pressable
              key={p.key}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
                setActiveProvider(p.key);
              }}
              style={[
                styles.providerChip,
                activeProvider === p.key && styles.providerChipActive,
              ]}
            >
              <Text
                style={[
                  styles.providerChipText,
                  activeProvider === p.key && styles.providerChipTextActive,
                ]}
              >
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* API Keys */}
        <Text style={styles.sectionTitle}>API Keys</Text>
        <Text style={styles.sectionNote}>
          Your keys are stored securely on this device and never sent to any
          server other than the AI provider.
        </Text>

        {PROVIDERS.map((p) => (
          <ApiKeyField
            key={p.key}
            label={p.label}
            hint={p.hint}
            value={keys[p.key]}
            onChange={(v) => setKeys((prev) => ({ ...prev, [p.key]: v }))}
            isActive={activeProvider === p.key}
          />
        ))}

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveButton,
            saved && styles.saveButtonSaved,
            pressed && { opacity: 0.85 },
            saving && { opacity: 0.6 },
          ]}
        >
          {saved ? (
            <>
              <Feather name="check" size={16} color={Colors.dark.background} />
              <Text style={styles.saveButtonText}>Saved!</Text>
            </>
          ) : (
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Keys"}
            </Text>
          )}
        </Pressable>

        {/* Voice (TTS) settings */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Voice</Text>
        <View style={styles.toggleCard}>
          <View style={styles.toggleInfo}>
            <Feather name="volume-2" size={18} color={Colors.dark.tint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleCardLabel}>Speak Responses (TTS)</Text>
              <Text style={styles.toggleCardHint}>
                Jarvis will read AI replies aloud automatically
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setTtsEnabled(!ttsEnabled);
            }}
            style={[
              styles.toggleSwitch,
              ttsEnabled && styles.toggleSwitchActive,
            ]}
          >
            <View
              style={[
                styles.toggleKnob,
                ttsEnabled && styles.toggleKnobActive,
              ]}
            />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Danger Zone</Text>
        <Pressable
          onPress={handleClearChat}
          style={({ pressed }) => [
            styles.dangerButton,
            pressed && { opacity: 0.7 },
            messages.length === 0 && { opacity: 0.4 },
          ]}
          disabled={messages.length === 0}
        >
          <Feather name="trash-2" size={16} color={Colors.dark.error} />
          <Text style={styles.dangerButtonText}>Clear Chat History</Text>
        </Pressable>

        <View style={styles.infoCard}>
          <Feather
            name="shield"
            size={16}
            color={Colors.dark.tint}
            style={{ marginTop: 1 }}
          />
          <Text style={styles.infoText}>
            Keys are stored using the platform's secure storage (Keychain on
            iOS, Keystore on Android). They remain on your device.
          </Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
    marginBottom: 4,
  },
  sectionNote: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  providerRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  providerChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  providerChipActive: {
    borderColor: Colors.dark.tint,
    backgroundColor: "rgba(0, 212, 255, 0.1)",
  },
  providerChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.dark.textSecondary,
  },
  providerChipTextActive: {
    color: Colors.dark.tint,
  },
  keyCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 16,
    gap: 8,
  },
  keyCardActive: {
    borderColor: "rgba(0, 212, 255, 0.3)",
  },
  keyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  keyLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  keySetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 229, 160, 0.1)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  keySetText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.success,
  },
  keyHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textMuted,
  },
  keyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingLeft: 12,
    paddingRight: 4,
  },
  keyInput: {
    flex: 1,
    height: 42,
    color: Colors.dark.text,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  eyeButton: {
    width: 40,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.dark.tint,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonSaved: {
    backgroundColor: Colors.dark.success,
    shadowColor: Colors.dark.success,
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.dark.background,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: 14,
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleCardLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  toggleCardHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.textMuted,
  },
  toggleKnobActive: {
    backgroundColor: Colors.dark.tint,
    alignSelf: "flex-end",
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 68, 68, 0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
    paddingVertical: 16,
  },
  dangerButtonText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.error,
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(0, 212, 255, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.15)",
    padding: 14,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
});
