import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(trimmed);
    setText("");
    inputRef.current?.focus();
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message Jarvis..."
          placeholderTextColor={Colors.dark.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="default"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
          editable={!disabled}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={({ pressed }) => [
            styles.sendButton,
            canSend && styles.sendButtonActive,
            pressed && canSend && { opacity: 0.7 },
          ]}
        >
          <Feather
            name="arrow-up"
            size={18}
            color={canSend ? Colors.dark.background : Colors.dark.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingTop: 6,
    paddingBottom: 6,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: Colors.dark.tint,
  },
});
