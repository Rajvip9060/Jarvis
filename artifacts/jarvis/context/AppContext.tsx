import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Speech from "expo-speech";
import { Platform } from "react-native";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  imageUri?: string;
}

export interface ApiKeys {
  gemini: string;
  openai: string;
  openrouter: string;
}

export type AIProvider = "gemini" | "openai" | "openrouter";

interface AppContextType {
  messages: Message[];
  isListening: boolean;
  isSpeaking: boolean;
  isStreaming: boolean;
  showTyping: boolean;
  backgroundListening: boolean;
  ttsEnabled: boolean;
  apiKeys: ApiKeys;
  activeProvider: AIProvider;
  setActiveProvider: (p: AIProvider) => void;
  sendMessage: (text: string, imageBase64?: string, imageMime?: string, imageUri?: string) => Promise<void>;
  deleteHistory: () => void;
  setBackgroundListening: (val: boolean) => void;
  setTtsEnabled: (val: boolean) => void;
  saveApiKeys: (keys: ApiKeys) => Promise<void>;
  setIsListening: (val: boolean) => void;
  setIsSpeaking: (val: boolean) => void;
  stopSpeaking: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "jarvis_messages";
const BACKGROUND_KEY = "jarvis_background_listening";
const PROVIDER_KEY = "jarvis_provider";
const TTS_KEY = "jarvis_tts_enabled";

let msgCounter = 0;
function generateId(): string {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

async function secureGet(key: string): Promise<string> {
  if (Platform.OS === "web") {
    return (await AsyncStorage.getItem(key)) ?? "";
  }
  return (await SecureStore.getItemAsync(key)) ?? "";
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function callGemini(
  messages: Message[],
  apiKey: string,
  onChunk: (text: string) => void,
  imageBase64?: string,
  imageMime?: string
): Promise<void> {
  const contents = messages.map((m, idx) => {
    const isLastUser = m.role === "user" && idx === messages.length - 1;
    if (isLastUser && imageBase64 && imageMime) {
      return {
        role: "user",
        parts: [
          { text: m.content || "What is in this image?" },
          { inlineData: { mimeType: imageMime, data: imageBase64 } },
        ],
      };
    }
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    };
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [
            {
              text: "You are Jarvis, an advanced AI assistant. Be concise, intelligent, and helpful. Respond naturally as if you are a sophisticated AI.",
            },
          ],
        },
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const text =
          parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text) onChunk(text);
      } catch {}
    }
  }
}

async function callOpenAI(
  messages: Message[],
  apiKey: string,
  onChunk: (text: string) => void
): Promise<void> {
  const chatMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are Jarvis, an advanced AI assistant. Be concise, intelligent, and helpful.",
        },
        ...chatMessages,
      ],
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed?.choices?.[0]?.delta?.content ?? "";
        if (text) onChunk(text);
      } catch {}
    }
  }
}

async function callOpenRouter(
  messages: Message[],
  apiKey: string,
  onChunk: (text: string) => void
): Promise<void> {
  const chatMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://jarvis.app",
        "X-Title": "Jarvis AI",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content:
              "You are Jarvis, an advanced AI assistant. Be concise, intelligent, and helpful.",
          },
          ...chatMessages,
        ],
        stream: true,
        max_tokens: 2048,
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed?.choices?.[0]?.delta?.content ?? "";
        if (text) onChunk(text);
      } catch {}
    }
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [backgroundListening, setBackgroundListeningState] = useState(false);
  const [ttsEnabled, setTtsEnabledState] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: "",
    openai: "",
    openrouter: "",
  });
  const [activeProvider, setActiveProvider] = useState<AIProvider>("gemini");
  const initialized = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [stored, bg, provider, tts, gemini, openai, openrouter] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(BACKGROUND_KEY),
            AsyncStorage.getItem(PROVIDER_KEY),
            AsyncStorage.getItem(TTS_KEY),
            secureGet("jarvis_key_gemini"),
            secureGet("jarvis_key_openai"),
            secureGet("jarvis_key_openrouter"),
          ]);

        if (stored && !initialized.current) {
          const parsed = JSON.parse(stored) as Message[];
          setMessages(parsed);
        }
        if (bg) setBackgroundListeningState(bg === "true");
        if (provider) setActiveProvider(provider as AIProvider);
        if (tts !== null) setTtsEnabledState(tts === "true");
        setApiKeys({ gemini, openai, openrouter });
        initialized.current = true;
      } catch {}
    })();
  }, []);

  const saveMessages = useCallback(async (msgs: Message[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    } catch {}
  }, []);

  const stopSpeaking = useCallback(() => {
    try {
      Speech.stop();
    } catch {}
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      try {
        Speech.stop();
      } catch {}
      const clean = text
        .replace(/```[\s\S]*?```/g, "code block")
        .replace(/[*_~`#]/g, "")
        .replace(/\n+/g, " ")
        .trim();
      if (!clean) return;
      setIsSpeaking(true);
      try {
        Speech.speak(clean, {
          rate: 1.0,
          pitch: 1.0,
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
        });
      } catch {
        setIsSpeaking(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (
      text: string,
      imageBase64?: string,
      imageMime?: string,
      imageUri?: string
    ) => {
      if (isStreaming) return;

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: text || (imageBase64 ? "What's in this image?" : ""),
        timestamp: Date.now(),
        imageUri,
      };

      const currentMsgs = [...messages, userMsg];
      setMessages(currentMsgs);
      setIsStreaming(true);
      setShowTyping(true);

      let fullContent = "";
      let assistantAdded = false;
      let assistantId = generateId();

      try {
        const provider = activeProvider;
        const keys = apiKeys;

        const onChunk = (chunk: string) => {
          fullContent += chunk;
          if (!assistantAdded) {
            setShowTyping(false);
            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: fullContent,
                timestamp: Date.now(),
              },
            ]);
            assistantAdded = true;
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: fullContent,
              };
              return updated;
            });
          }
        };

        if (provider === "gemini") {
          if (!keys.gemini)
            throw new Error(
              "No Gemini API key set. Go to Settings to add one."
            );
          await callGemini(currentMsgs, keys.gemini, onChunk, imageBase64, imageMime);
        } else if (provider === "openai") {
          if (!keys.openai)
            throw new Error(
              "No OpenAI API key set. Go to Settings to add one."
            );
          await callOpenAI(currentMsgs, keys.openai, onChunk);
        } else {
          if (!keys.openrouter)
            throw new Error(
              "No OpenRouter API key set. Go to Settings to add one."
            );
          await callOpenRouter(currentMsgs, keys.openrouter, onChunk);
        }

        if (!assistantAdded) {
          setShowTyping(false);
          const noContentMsg: Message = {
            id: assistantId,
            role: "assistant",
            content: "I received your message but had no response.",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, noContentMsg]);
          fullContent = noContentMsg.content;
        }

        if (ttsEnabled && fullContent) {
          speakText(fullContent);
        }
      } catch (err: unknown) {
        setShowTyping(false);
        const errMsg =
          err instanceof Error ? err.message : "An error occurred.";
        const errorMessage: Message = {
          id: assistantAdded ? generateId() : assistantId,
          role: "assistant",
          content: errMsg,
          timestamp: Date.now(),
        };
        if (!assistantAdded) {
          setMessages((prev) => [...prev, errorMessage]);
        } else {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: errMsg,
            };
            return updated;
          });
        }
      } finally {
        setIsStreaming(false);
        setShowTyping(false);
        setMessages((prev) => {
          saveMessages(prev);
          return prev;
        });
      }
    },
    [messages, isStreaming, activeProvider, apiKeys, saveMessages, ttsEnabled, speakText]
  );

  const deleteHistory = useCallback(() => {
    stopSpeaking();
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }, [stopSpeaking]);

  const setBackgroundListening = useCallback((val: boolean) => {
    setBackgroundListeningState(val);
    AsyncStorage.setItem(BACKGROUND_KEY, String(val));
  }, []);

  const setTtsEnabled = useCallback((val: boolean) => {
    setTtsEnabledState(val);
    AsyncStorage.setItem(TTS_KEY, String(val));
    if (!val) {
      try {
        Speech.stop();
      } catch {}
      setIsSpeaking(false);
    }
  }, []);

  const saveApiKeys = useCallback(async (keys: ApiKeys) => {
    await Promise.all([
      secureSet("jarvis_key_gemini", keys.gemini),
      secureSet("jarvis_key_openai", keys.openai),
      secureSet("jarvis_key_openrouter", keys.openrouter),
    ]);
    setApiKeys(keys);
  }, []);

  return (
    <AppContext.Provider
      value={{
        messages,
        isListening,
        isSpeaking,
        isStreaming,
        showTyping,
        backgroundListening,
        ttsEnabled,
        apiKeys,
        activeProvider,
        setActiveProvider,
        sendMessage,
        deleteHistory,
        setBackgroundListening,
        setTtsEnabled,
        saveApiKeys,
        setIsListening,
        setIsSpeaking,
        stopSpeaking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
