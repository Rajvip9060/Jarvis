import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Image,
  Alert,
} from "react-native";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";

interface ChatInputProps {
  onSend: (
    text: string,
    imageBase64?: string,
    imageMime?: string,
    imageUri?: string
  ) => void;
  disabled?: boolean;
}

export default function ChatInput({
  onSend,
  disabled = false,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [pendingImage, setPendingImage] = useState<{
    uri: string;
    base64: string;
    mime: string;
  } | null>(null);
  const inputRef = useRef<TextInput>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && !pendingImage) return;
    if (disabled) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSend(
      trimmed || (pendingImage ? "What's in this image?" : ""),
      pendingImage?.base64,
      pendingImage?.mime,
      pendingImage?.uri
    );
    setText("");
    setPendingImage(null);
    inputRef.current?.focus();
  };

  const handlePickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Allow photo access to send images."
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mime = asset.mimeType ?? "image/jpeg";
        const base64 = asset.base64 ?? "";
        setPendingImage({ uri: asset.uri, base64, mime });
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch {
      Alert.alert("Error", "Could not open the image picker.");
    }
  };

  const handleCameraCapture = async () => {
    if (Platform.OS === "web") {
      await handlePickImage();
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to take photos.");
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mime = asset.mimeType ?? "image/jpeg";
        const base64 = asset.base64 ?? "";
        setPendingImage({ uri: asset.uri, base64, mime });
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch {
      Alert.alert("Error", "Could not open the camera.");
    }
  };

  const canSend = (text.trim().length > 0 || !!pendingImage) && !disabled;

  return (
    <View style={styles.wrapper}>
      {pendingImage && (
        <View style={styles.imagePreviewRow}>
          <Image source={{ uri: pendingImage.uri }} style={styles.imageThumb} />
          <Pressable
            style={styles.removeImage}
            onPress={() => setPendingImage(null)}
          >
            <Feather name="x" size={12} color="#fff" />
          </Pressable>
        </View>
      )}
      <View style={styles.inputRow}>
        <Pressable
          onPress={handleCameraCapture}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Feather name="camera" size={20} color={Colors.dark.textSecondary} />
        </Pressable>
        <Pressable
          onPress={handlePickImage}
          style={({ pressed }) => [
            styles.iconButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Feather name="image" size={20} color={Colors.dark.textSecondary} />
        </Pressable>
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
  wrapper: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.background,
  },
  imagePreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  imageThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dark.tint,
  },
  removeImage: {
    position: "absolute",
    top: -6,
    left: 48,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.dark.error,
    alignItems: "center",
    justifyContent: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.dark.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 4,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  input: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    maxHeight: 120,
    paddingTop: 6,
    paddingBottom: 6,
    paddingHorizontal: 4,
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
