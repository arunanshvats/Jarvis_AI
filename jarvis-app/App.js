import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";

import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";

import * as Speech from "expo-speech";

export default function App() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const audioPlayer = useAudioPlayer(null);

  const [message, setMessage] = useState("SYSTEM READY");
  const [voiceStatus, setVoiceStatus] = useState("STANDBY");
  const [lastRecording, setLastRecording] = useState(null);
  const [draft, setDraft] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome",
      role: "jarvis",
      text: "Hello. JARVIS interface is online. Type a message to begin.",
    },
  ]);
  const [lastReply, setLastReply] = useState(
    "Hello. JARVIS interface is online. Type a message to begin."
  );

  const getDemoReply = (input) => {
    const text = input.toLowerCase().trim();

    if (/^(hi|hello|hey|hii|namaste|नमस्ते)\b/.test(text)) {
      return "Hello! I'm online. What would you like to do?";
    }

    if (text.includes("your name") || text.includes("who are you") || text.includes("tumhara naam")) {
      return "I am JARVIS, your personal assistant interface. My AI brain is not connected yet.";
    }

    if (text.includes("time") || text.includes("samay") || text.includes("kitne baje")) {
      return "The current time on this device is " + new Date().toLocaleTimeString() + ".";
    }

    if (text.includes("help") || text.includes("madad")) {
      return "I can receive messages and speak demo replies right now. A real AI connection is the next upgrade.";
    }

    return "I received your message: “" + input + "”. I'm currently running in demo mode, so my AI brain is not connected yet.";
  };

  const sendMessage = () => {
    const cleanText = draft.trim();
    if (!cleanText) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      text: cleanText,
    };
    const reply = getDemoReply(cleanText);
    const jarvisMessage = {
      id: (Date.now() + 1).toString(),
      role: "jarvis",
      text: reply,
    };

    setChatMessages((current) => [...current, userMessage, jarvisMessage]);
    setLastReply(reply);
    setDraft("");
    setMessage("MESSAGE RECEIVED • DEMO MODE");
  };

  const speakReply = () => {
    if (!lastReply) return;

    Speech.stop();
    setVoiceStatus("SPEAKING REPLY");

    Speech.speak(lastReply, {
      language: "en-IN",
      rate: 0.92,
      onDone: () => setVoiceStatus("STANDBY"),
      onError: () => setVoiceStatus("VOICE ERROR"),
    });
  };

  const startRecording = async () => {
    try {
      const permission =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!permission.granted) {
        setMessage("MICROPHONE PERMISSION DENIED");
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      setMessage("MICROPHONE ACTIVE");
    } catch (error) {
      setMessage("RECORDING ERROR: " + error.message);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: false,
      });

      setLastRecording(audioRecorder.uri || null);
      setMessage("RECORDING COMPLETE");
    } catch (error) {
      setMessage("STOP ERROR: " + error.message);
    }
  };

  const playRecording = () => {
    if (!lastRecording) {
      setMessage("NO RECORDING AVAILABLE");
      return;
    }

    audioPlayer.replace(lastRecording);
    audioPlayer.play();
    setMessage("PLAYING LAST RECORDING");
  };

  const pauseRecording = () => {
    audioPlayer.pause();
    setMessage("PLAYBACK PAUSED");
  };

  const downloadRecording = () => {
    if (Platform.OS !== "web" || !lastRecording) {
      setMessage("DOWNLOAD AVAILABLE IN BROWSER PREVIEW");
      return;
    }

    const link = document.createElement("a");
    link.href = lastRecording;
    link.download = "jarvis-recording.webm";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage("DOWNLOAD REQUESTED");
  };

  const speakEnglish = () => {
    Speech.stop();
    setVoiceStatus("SPEAKING ENGLISH");

    Speech.speak("Hello. JARVIS voice system is online.", {
      language: "en-IN",
      rate: 0.92,
      onDone: () => setVoiceStatus("STANDBY"),
      onError: () => setVoiceStatus("VOICE ERROR"),
    });
  };

  const speakHindi = () => {
    Speech.stop();
    setVoiceStatus("SPEAKING HINDI");

    Speech.speak("नमस्ते। JARVIS वॉइस सिस्टम तैयार है।", {
      language: "hi-IN",
      rate: 0.9,
      onDone: () => setVoiceStatus("STANDBY"),
      onError: () => setVoiceStatus("VOICE ERROR"),
    });
  };

  const stopVoice = () => {
    Speech.stop();
    setVoiceStatus("STANDBY");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050b14" />

      <Text style={styles.topLabel}>PERSONAL AI SYSTEM</Text>
      <Text style={styles.title}>J.A.R.V.I.S</Text>
      <Text style={styles.subtitle}>
        JUST A RATHER VERY INTELLIGENT SYSTEM
      </Text>

      <View style={styles.orb}>
        <View style={styles.innerOrb}>
          <Text style={styles.orbText}>J</Text>
        </View>
      </View>

      <Text style={styles.systemStatus}>{message}</Text>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>JARVIS CHAT</Text>
        <Text style={styles.info}>
          TEXT INTERFACE • DEMO MODE • AI BRAIN NOT CONNECTED
        </Text>

        <View style={styles.chatWindow}>
          {chatMessages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.chatBubble,
                item.role === "user" ? styles.userBubble : styles.jarvisBubble,
              ]}
            >
              <Text style={styles.chatSender}>
                {item.role === "user" ? "YOU" : "JARVIS"}
              </Text>
              <Text style={styles.chatText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Type a message..."
          placeholderTextColor="#66849d"
          multiline
          maxLength={1000}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />

        <Pressable style={styles.button} onPress={sendMessage}>
          <Text style={styles.buttonText}>SEND MESSAGE</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={speakReply}>
          <Text style={styles.buttonText}>SPEAK LAST REPLY</Text>
        </Pressable>
        <Text style={styles.info}>Voice: {voiceStatus}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>AUDIO CONTROL</Text>

        <Pressable
          style={[
            styles.button,
            recorderState.isRecording && styles.activeButton,
          ]}
          onPress={
            recorderState.isRecording ? stopRecording : startRecording
          }
        >
          <Text style={styles.buttonText}>
            {recorderState.isRecording
              ? "STOP RECORDING"
              : "START RECORDING"}
          </Text>
        </Pressable>

        <Text style={styles.info}>
          Microphone: {recorderState.isRecording ? "ACTIVE" : "STANDBY"}
        </Text>

        <Text style={styles.info}>
          {lastRecording ? "Recording ready" : "No recording yet"}
        </Text>

        <Pressable
          style={styles.button}
          onPress={playRecording}
          disabled={!lastRecording}
        >
          <Text style={styles.buttonText}>PLAY RECORDING</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={pauseRecording}>
          <Text style={styles.buttonText}>PAUSE PLAYBACK</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={downloadRecording}
          disabled={!lastRecording}
        >
          <Text style={styles.buttonText}>DOWNLOAD RECORDING</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>VOICE OUTPUT</Text>

        <Pressable style={styles.button} onPress={speakEnglish}>
          <Text style={styles.buttonText}>TEST ENGLISH VOICE</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={speakHindi}>
          <Text style={styles.buttonText}>TEST HINDI VOICE</Text>
        </Pressable>

        <Pressable style={styles.stopButton} onPress={stopVoice}>
          <Text style={styles.buttonText}>STOP VOICE</Text>
        </Pressable>

        <Text style={styles.info}>Voice: {voiceStatus}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>SYSTEM DIAGNOSTICS</Text>
        <Text style={styles.info}>MICROPHONE: READY FOR TEST</Text>
        <Text style={styles.info}>VOICE OUTPUT: TEST MODE</Text>
        <Text style={styles.info}>CHAT INTERFACE: ONLINE</Text>
        <Text style={styles.info}>AI BRAIN: NOT CONNECTED</Text>
        <Text style={styles.info}>SPEECH RECOGNITION: NOT CONNECTED</Text>
        <Text style={styles.info}>WAKE WORD: NOT CONNECTED</Text>
      </View>

      <Text style={styles.footer}>JARVIS SYSTEM • VERSION 1.1</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#050b14",
    alignItems: "center",
    padding: 22,
    paddingTop: 55,
  },
  topLabel: {
    color: "#4baeff",
    fontSize: 12,
    letterSpacing: 4,
  },
  title: {
    color: "#e8f5ff",
    fontSize: 38,
    fontWeight: "bold",
    letterSpacing: 5,
    marginTop: 10,
  },
  subtitle: {
    color: "#66849d",
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: "center",
  },
  orb: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 2,
    borderColor: "#168dff",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 32,
    backgroundColor: "#0a1d32",
  },
  innerOrb: {
    width: 125,
    height: 125,
    borderRadius: 63,
    backgroundColor: "#103b62",
    borderWidth: 2,
    borderColor: "#54bdff",
    alignItems: "center",
    justifyContent: "center",
  },
  orbText: {
    color: "#bdeaff",
    fontSize: 65,
    fontWeight: "200",
  },
  systemStatus: {
    color: "#53c6ff",
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 20,
    textAlign: "center",
  },
  panel: {
    width: "100%",
    backgroundColor: "#0b1725",
    borderColor: "#173a58",
    borderWidth: 1,
    borderRadius: 14,
    padding: 18,
    marginBottom: 17,
  },
  sectionTitle: {
    color: "#54bdff",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 16,
  },
  chatWindow: {
    backgroundColor: "#07111d",
    borderColor: "#173a58",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    marginBottom: 12,
    gap: 10,
  },
  chatBubble: {
    maxWidth: "92%",
    padding: 12,
    borderRadius: 10,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#123b5d",
    borderColor: "#269fff",
    borderWidth: 1,
  },
  jarvisBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#142333",
    borderColor: "#31516b",
    borderWidth: 1,
  },
  chatSender: {
    color: "#54bdff",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  chatText: {
    color: "#e8f5ff",
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    minHeight: 48,
    maxHeight: 110,
    color: "#e8f5ff",
    backgroundColor: "#07111d",
    borderColor: "#31516b",
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 11,
  },
  button: {
    backgroundColor: "#103b62",
    borderColor: "#269fff",
    borderWidth: 1,
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginBottom: 11,
  },
  activeButton: {
    backgroundColor: "#7b2634",
    borderColor: "#ff667b",
  },
  stopButton: {
    backgroundColor: "#29202a",
    borderColor: "#b85b70",
    borderWidth: 1,
    padding: 15,
    borderRadius: 9,
    alignItems: "center",
    marginBottom: 11,
  },
  buttonText: {
    color: "#e8f5ff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  info: {
    color: "#9ab3c8",
    fontSize: 11,
    marginTop: 9,
  },
  footer: {
    color: "#47647d",
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 10,
    marginBottom: 25,
  },
});
