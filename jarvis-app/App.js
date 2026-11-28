import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Speech from "expo-speech";

const SYSTEM_PROMPT = `You are JARVIS, Arunansh's personal AI assistant and intelligent companion.

PERSONALITY
- Be intelligent, analytical, calm, practical, and naturally conversational.
- Speak in casual, natural Hinglish by default. If the user writes in English or another language, follow their language.
- Use witty humour and occasional sharp, playful sarcasm when the moment suits it. Never force jokes into serious conversations.
- Be friendly and engaging without being clingy, romantic, overfamiliar, or fake.
- Be honest. Never agree just to please the user. Point out weak logic, missing information, risks, and better alternatives respectfully.
- Avoid generic praise, filler introductions, and robotic phrases such as "How may I assist you today?" in every reply.
- Give useful detail when needed, but keep simple answers concise. Ask one clear question when essential information is missing.

ASSISTANT BEHAVIOUR
- Help with learning, coding, planning, troubleshooting, research, creativity, and everyday problem-solving.
- Explain technical steps one at a time when the user is working in a terminal. Never pretend a command succeeded unless the user confirms it.
- Do not claim to have browsed, changed files, sent messages, remembered something permanently, or performed an action unless it actually happened.
- You may use the conversation history supplied in this chat for context. Do not claim permanent memory; it will be added separately.
- Give practical warnings when an idea is unsafe, unrealistic, or likely to fail.
- Be supportive without replacing real-world friends, family, teachers, or professionals.

IDENTITY
- Your name is JARVIS.
- You are software: do not claim to be human or to have a body or feelings.
- Your purpose is to help the user think clearly, learn, build things, and get useful work done.`;

const initialMessages = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "JARVIS interface online. Pehle server URL connect karte hain; phir main generic demo replies ke bajaye Qwen3 se real responses dunga.",
  },
];

function cleanBaseUrl(value) {
  return value.trim().replace(/\/+$/, "");
}

export default function App() {
  const [apiBase, setApiBase] = useState("");
  const [connection, setConnection] = useState("NOT CONNECTED");
  const [connectionError, setConnectionError] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [busy, setBusy] = useState(false);
  const [lastReply, setLastReply] = useState(initialMessages[0].content);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, busy]);

  const checkConnection = async () => {
    const base = cleanBaseUrl(apiBase);
    if (!base) {
      setConnection("URL REQUIRED");
      setConnectionError("Paste the forwarded Codespaces URL for port 8080.");
      return;
    }

    setConnection("CONNECTING");
    setConnectionError("");
    try {
      const response = await fetch(base + "/health");
      if (!response.ok) throw new Error("Server returned HTTP " + response.status);
      const data = await response.json();
      if (data.status && data.status !== "ok") {
        throw new Error("Model server is not ready yet.");
      }
      setConnection("ONLINE");
      setConnectionError("");
      setSettingsOpen(false);
    } catch (error) {
      setConnection("OFFLINE");
      setConnectionError(
        "Could not reach llama-server. Check that port 8080 is running and its URL is correct. " +
          (error?.message || "")
      );
    }
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || busy) return;

    const base = cleanBaseUrl(apiBase);
    if (!base) {
      setSettingsOpen(true);
      setConnection("URL REQUIRED");
      setConnectionError("Connect port 8080 before sending a message.");
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setBusy(true);
    setConnectionError("");

    try {
      const history = nextMessages
        .filter((item) => item.id !== "welcome")
        .slice(-16)
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: item.content,
        }));

      const response = await fetch(base + "/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "qwen3-4b",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
          temperature: 0.75,
          max_tokens: 600,
          stream: false,
          chat_template_kwargs: { enable_thinking: false },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error?.message || data?.message || "HTTP " + response.status
        );
      }

      const reply =
        data?.choices?.[0]?.message?.content ||
        data?.choices?.[0]?.text ||
        "I received an empty response. Please try again.";

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: String(reply).trim(),
      };
      setMessages((current) => [...current, assistantMessage]);
      setLastReply(assistantMessage.content);
      setConnection("ONLINE");
    } catch (error) {
      const friendlyError =
        "Qwen se connection nahi ho paaya. " +
        (error?.message || "Unknown error") +
        " — server URL, port 8080 aur server terminal check karo.";
      setConnectionError(friendlyError);
      setMessages((current) => [
        ...current,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: friendlyError,
        },
      ]);
      setConnection("ERROR");
    } finally {
      setBusy(false);
    }
  };

  const speakLastReply = () => {
    if (!lastReply) return;
    Speech.stop();
    Speech.speak(lastReply, {
      language: "hi-IN",
      rate: 0.94,
      pitch: 1.0,
    });
  };

  const stopSpeaking = () => Speech.stop();

  const resetChat = () => {
    Speech.stop();
    setMessages(initialMessages);
    setLastReply(initialMessages[0].content);
    setConnectionError("");
  };

  const statusColor =
    connection === "ONLINE"
      ? "#56e0b0"
      : connection === "CONNECTING"
        ? "#f4c76b"
        : "#ff8290";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#060b14" />
      <View style={styles.backgroundGlow} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>J</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>J.A.R.V.I.S</Text>
            <Text style={styles.brandTag}>PERSONAL INTELLIGENCE SYSTEM</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {connection}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.orbOuter}>
            <View style={styles.orbRing} />
            <View style={styles.orbCore}>
              <Text style={styles.orbLetter}>J</Text>
              <Text style={styles.orbCaption}>AI CORE</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>At your service.</Text>
          <Text style={styles.heroSubtitle}>
            Your assistant. Your workflow. One conversation.
          </Text>
          <View style={styles.capabilityRow}>
            <Text style={styles.capability}>QWEN3 4B</Text>
            <View style={styles.capabilityDivider} />
            <Text style={styles.capability}>LOCAL MODEL</Text>
            <View style={styles.capabilityDivider} />
            <Text style={styles.capability}>LLAMA.CPP</Text>
          </View>
        </View>

        <View style={styles.panel}>
          <Pressable
            style={styles.panelHeading}
            onPress={() => setSettingsOpen((value) => !value)}
          >
            <View>
              <Text style={styles.eyebrow}>CONNECTION</Text>
              <Text style={styles.panelTitle}>AI engine link</Text>
            </View>
            <Text style={styles.panelAction}>
              {settingsOpen ? "HIDE −" : "SETTINGS +"}
            </Text>
          </Pressable>

          {settingsOpen && (
            <View style={styles.settingsBody}>
              <Text style={styles.helperText}>
                Codespaces ke PORTS tab se port 8080 ka forwarded URL copy
                karke yahan paste karo. URL mein /v1 ya /health mat jodna.
              </Text>
              <TextInput
                value={apiBase}
                onChangeText={setApiBase}
                placeholder="https://YOUR-CODESPACE-8080.app.github.dev"
                placeholderTextColor="#60748c"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.urlInput}
              />
              <Pressable
                style={[
                  styles.connectButton,
                  connection === "CONNECTING" && styles.disabledButton,
                ]}
                onPress={checkConnection}
                disabled={connection === "CONNECTING"}
              >
                {connection === "CONNECTING" ? (
                  <ActivityIndicator color="#06101b" />
                ) : (
                  <Text style={styles.connectButtonText}>TEST CONNECTION</Text>
                )}
              </Pressable>
              {!!connectionError && (
                <Text style={styles.errorText}>{connectionError}</Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.chatPanel}>
          <View style={styles.chatHeader}>
            <View>
              <Text style={styles.eyebrow}>LIVE SESSION</Text>
              <Text style={styles.panelTitle}>Talk to JARVIS</Text>
            </View>
            <Pressable onPress={resetChat} style={styles.resetButton}>
              <Text style={styles.resetText}>NEW CHAT ↺</Text>
            </Pressable>
          </View>

          <View style={styles.messageList}>
            {messages.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  item.role === "user" ? styles.userRow : styles.assistantRow,
                ]}
              >
                {item.role === "assistant" && (
                  <View style={styles.miniAvatar}>
                    <Text style={styles.miniAvatarText}>J</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.bubble,
                    item.role === "user" ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text style={styles.messageLabel}>
                    {item.role === "user" ? "YOU" : "JARVIS"}
                  </Text>
                  <Text style={styles.messageText}>{item.content}</Text>
                </View>
              </View>
            ))}
            {busy && (
              <View style={[styles.messageRow, styles.assistantRow]}>
                <View style={styles.miniAvatar}>
                  <Text style={styles.miniAvatarText}>J</Text>
                </View>
                <View style={[styles.bubble, styles.aiBubble, styles.thinkingBubble]}>
                  <ActivityIndicator color="#70d8ff" size="small" />
                  <Text style={styles.thinkingText}>JARVIS IS THINKING</Text>
                </View>
              </View>
            )}
          </View>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message JARVIS..."
            placeholderTextColor="#70849a"
            multiline
            maxLength={3000}
            style={styles.composer}
          />
          <View style={styles.composerActions}>
            <Text style={styles.inputHint}>Hinglish • English • Anything</Text>
            <Pressable
              style={[
                styles.sendButton,
                (!draft.trim() || busy) && styles.disabledButton,
              ]}
              onPress={sendMessage}
              disabled={!draft.trim() || busy}
            >
              <Text style={styles.sendButtonText}>
                {busy ? "THINKING..." : "SEND  ↗"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.toolsPanel}>
          <View style={styles.toolCopy}>
            <Text style={styles.eyebrow}>VOICE OUTPUT</Text>
            <Text style={styles.toolTitle}>Hear the last reply</Text>
            <Text style={styles.helperText}>
              Device ki available Hindi voice use hogi. Voice input / speech
              recognition abhi next development phase mein hai.
            </Text>
          </View>
          <View style={styles.voiceActions}>
            <Pressable style={styles.voiceButton} onPress={speakLastReply}>
              <Text style={styles.voiceButtonText}>▶  SPEAK</Text>
            </Pressable>
            <Pressable style={styles.stopVoiceButton} onPress={stopSpeaking}>
              <Text style={styles.stopVoiceText}>STOP</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>JARVIS • BUILT TO THINK WITH YOU</Text>
          <Text style={styles.footerSubtext}>
            Chat context lasts for this session. Persistent memory is a separate
            feature we will add next.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#060b14",
  },
  backgroundGlow: {
    position: "absolute",
    top: -140,
    alignSelf: "center",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#0b3150",
    opacity: 0.24,
  },
  page: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 42,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3b9bd2",
    backgroundColor: "#0d2336",
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: {
    color: "#a9e8ff",
    fontSize: 25,
    fontWeight: "300",
  },
  brandCopy: {
    flex: 1,
    marginLeft: 11,
  },
  brandName: {
    color: "#e8f6ff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 3,
  },
  brandTag: {
    color: "#6e91aa",
    fontSize: 8,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#28445b",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#0b1724",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  hero: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 24,
  },
  orbOuter: {
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 1,
    borderColor: "#1e6d99",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#091b2b",
    marginBottom: 18,
  },
  orbRing: {
    position: "absolute",
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    borderColor: "#3aaddd",
    opacity: 0.55,
  },
  orbCore: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    borderColor: "#72d9ff",
    backgroundColor: "#103653",
    alignItems: "center",
    justifyContent: "center",
  },
  orbLetter: {
    color: "#d7f5ff",
    fontSize: 54,
    fontWeight: "200",
    lineHeight: 60,
  },
  orbCaption: {
    color: "#75c9ee",
    fontSize: 8,
    letterSpacing: 2,
  },
  heroTitle: {
    color: "#eff9ff",
    fontSize: 27,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    color: "#91a9bd",
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },
  capabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 17,
    borderWidth: 1,
    borderColor: "#203b50",
    backgroundColor: "#0a1521",
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  capability: {
    color: "#78c9ed",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  capabilityDivider: {
    width: 1,
    height: 10,
    backgroundColor: "#35536a",
    marginHorizontal: 10,
  },
  panel: {
    borderWidth: 1,
    borderColor: "#1c3a52",
    borderRadius: 16,
    backgroundColor: "#0b1622",
    padding: 16,
    marginBottom: 14,
  },
  panelHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: "#66c8f1",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
  panelTitle: {
    color: "#edf7ff",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  panelAction: {
    color: "#83c9e9",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  settingsBody: {
    marginTop: 13,
  },
  helperText: {
    color: "#91a7b9",
    fontSize: 11,
    lineHeight: 17,
  },
  urlInput: {
    color: "#eaf7ff",
    backgroundColor: "#07111b",
    borderWidth: 1,
    borderColor: "#29485f",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 12,
    marginTop: 12,
  },
  connectButton: {
    backgroundColor: "#70d7f7",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 43,
    marginTop: 10,
  },
  connectButtonText: {
    color: "#06101b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  errorText: {
    color: "#ff9aa5",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
  },
  chatPanel: {
    borderWidth: 1,
    borderColor: "#1c3a52",
    borderRadius: 16,
    backgroundColor: "#0b1622",
    padding: 14,
    marginBottom: 14,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  resetButton: {
    borderWidth: 1,
    borderColor: "#34536a",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  resetText: {
    color: "#a5c9dc",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  messageList: {
    backgroundColor: "#07111b",
    borderWidth: 1,
    borderColor: "#1b3448",
    borderRadius: 12,
    padding: 11,
    minHeight: 180,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  miniAvatar: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: "#123954",
    borderWidth: 1,
    borderColor: "#4bb5e3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  miniAvatarText: {
    color: "#c8f1ff",
    fontSize: 13,
    fontWeight: "700",
  },
  bubble: {
    maxWidth: "86%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  aiBubble: {
    backgroundColor: "#112638",
    borderWidth: 1,
    borderColor: "#274960",
    borderBottomLeftRadius: 3,
  },
  userBubble: {
    backgroundColor: "#123b5b",
    borderWidth: 1,
    borderColor: "#287db0",
    borderBottomRightRadius: 3,
  },
  messageLabel: {
    color: "#79c9ed",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 5,
  },
  messageText: {
    color: "#e8f4fc",
    fontSize: 13,
    lineHeight: 19,
  },
  thinkingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  thinkingText: {
    color: "#8bd8f5",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  composer: {
    minHeight: 48,
    maxHeight: 120,
    color: "#eef8ff",
    backgroundColor: "#07111b",
    borderWidth: 1,
    borderColor: "#31536d",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 13,
    marginTop: 12,
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  inputHint: {
    color: "#7791a5",
    fontSize: 9,
  },
  sendButton: {
    backgroundColor: "#72d8f7",
    borderRadius: 9,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: "#06101b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  toolsPanel: {
    borderWidth: 1,
    borderColor: "#1c3a52",
    borderRadius: 16,
    backgroundColor: "#0b1622",
    padding: 16,
    marginBottom: 14,
  },
  toolTitle: {
    color: "#edf7ff",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 7,
  },
  voiceActions: {
    flexDirection: "row",
    marginTop: 13,
    gap: 9,
  },
  voiceButton: {
    flex: 1,
    backgroundColor: "#123e5b",
    borderWidth: 1,
    borderColor: "#3188b5",
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: "center",
  },
  voiceButtonText: {
    color: "#d7f5ff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  stopVoiceButton: {
    borderWidth: 1,
    borderColor: "#754352",
    borderRadius: 9,
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: "center",
  },
  stopVoiceText: {
    color: "#ffabb5",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  footer: {
    alignItems: "center",
    paddingTop: 10,
  },
  footerLine: {
    width: 50,
    height: 1,
    backgroundColor: "#35617b",
    marginBottom: 13,
  },
  footerText: {
    color: "#82a8bd",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
  footerSubtext: {
    color: "#627b8f",
    fontSize: 9,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 7,
    maxWidth: 320,
  },
});
