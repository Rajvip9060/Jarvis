import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Message } from "@/context/AppContext";
import Colors from "@/constants/colors";

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.aiContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>J</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {isUser && message.imageUri ? (
          <Image
            source={{ uri: message.imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
        {message.content ? (
          <Text style={[styles.text, isUser ? styles.userText : styles.aiText]}>
            {message.content}
          </Text>
        ) : null}
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
  userContainer: {
    justifyContent: "flex-end",
  },
  aiContainer: {
    justifyContent: "flex-start",
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
    marginBottom: 2,
  },
  aiBadgeText: {
    color: Colors.dark.tint,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 8,
  },
  userBubble: {
    backgroundColor: "rgba(0, 212, 255, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(0, 212, 255, 0.25)",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderBottomLeftRadius: 4,
  },
  image: {
    width: 200,
    height: 160,
    borderRadius: 10,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Inter_400Regular",
  },
  userText: {
    color: Colors.dark.text,
  },
  aiText: {
    color: Colors.dark.text,
  },
});
