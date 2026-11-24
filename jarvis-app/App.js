
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  ScrollView
} from 'react-native';

export default function App() {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('SYSTEM STANDBY');
  const [message, setMessage] = useState(
    'Tap START LISTENING to activate JARVIS.'
  );

  const streamRef = useRef(null);

  const startListening = async () => {
    if (streamRef.current) return;

    try {
      setStatus('CONNECTING MICROPHONE...');
      setMessage('Requesting microphone access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });

      streamRef.current = stream;
      setActive(true);
      setStatus('MICROPHONE ACTIVE');
      setMessage(
        'JARVIS microphone is active. Press STOP to disconnect.'
      );

    } catch (error) {
      setActive(false);
      setStatus('MICROPHONE ERROR');
      setMessage(error.name + ': ' + error.message);
    }
  };

  const stopListening = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setActive(false);
    setStatus('SYSTEM STANDBY');
    setMessage('Microphone disconnected safely.');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.logo}>J.A.R.V.I.S</Text>
        <Text style={styles.subtitle}>
          PERSONAL AI COMPANION
        </Text>

        <View style={styles.line} />

        <Text style={styles.greeting}>Good day, Sir.</Text>
        <Text style={styles.description}>
          Your personal AI companion.
          {'\n'}Always ready when you need it.
        </Text>

        <View style={[
          styles.orb,
          active && styles.orbActive
        ]}>
          <View style={styles.orbInner}>
            <Text style={styles.mic}>◉</Text>
          </View>
        </View>

        <Text style={styles.status}>{status}</Text>

        <Text style={styles.instruction}>
          {active
            ? 'Microphone is currently active'
            : 'Microphone is currently off'}
        </Text>

        <Pressable
          style={[
            styles.button,
            active && styles.stopButton
          ]}
          onPress={active ? stopListening : startListening}
        >
          <Text style={styles.buttonText}>
            {active ? 'STOP LISTENING' : 'START LISTENING'}
          </Text>
        </Pressable>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>
            SYSTEM DIAGNOSTICS
          </Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.statusRow}>
            <Text style={styles.label}>MICROPHONE</Text>
            <Text style={active ? styles.online : styles.pending}>
              {active ? 'ACTIVE' : 'OFFLINE'}
            </Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.label}>SPEECH RECOGNITION</Text>
            <Text style={styles.pending}>NOT CONNECTED</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.label}>AI BRAIN</Text>
            <Text style={styles.pending}>NOT CONNECTED</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          JARVIS AI • VERSION 1.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050b14'
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 55,
    paddingBottom: 35
  },
  logo: {
    color: '#63dfff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 8
  },
  subtitle: {
    color: '#718da8',
    fontSize: 10,
    letterSpacing: 4,
    marginTop: 9
  },
  line: {
    width: 180,
    height: 1,
    backgroundColor: '#24516c',
    marginVertical: 35
  },
  greeting: {
    color: '#eaf8ff',
    fontSize: 27,
    fontWeight: '600'
  },
  description: {
    color: '#8299ad',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10
  },
  orb: {
    width: 170,
    height: 170,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: '#267b9e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 38,
    backgroundColor: '#0b2030'
  },
  orbActive: {
    borderColor: '#65eaff',
    backgroundColor: '#12384a'
  },
  orbInner: {
    width: 125,
    height: 125,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#50b9dc',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mic: {
    color: '#80eaff',
    fontSize: 55
  },
  status: {
    color: '#65dfff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 27
  },
  instruction: {
    color: '#718da8',
    fontSize: 12,
    marginTop: 10
  },
  button: {
    backgroundColor: '#087da5',
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 10,
    marginTop: 25
  },
  stopButton: {
    backgroundColor: '#a83245'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2
  },
  panel: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#0b1623',
    borderWidth: 1,
    borderColor: '#1d3549',
    borderRadius: 14,
    padding: 20,
    marginTop: 35
  },
  panelTitle: {
    color: '#64dfff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 18
  },
  message: {
    color: '#eaf8ff',
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 15
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 9,
    flexWrap: 'wrap'
  },
  label: {
    color: '#a5b8c8',
    fontSize: 10
  },
  online: {
    color: '#55e6a5',
    fontSize: 10,
    fontWeight: '700'
  },
  pending: {
    color: '#e7b75e',
    fontSize: 10,
    fontWeight: '700'
  },
  footer: {
    color: '#40576c',
    fontSize: 10,
    letterSpacing: 3,
    marginTop: 35
  }
});
