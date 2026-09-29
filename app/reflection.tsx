import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { getJournalEntriesForDate, createJournalEntry, updateJournalEntry } from '@/utils/database';
import { getLocalDateKey } from '@/utils/planner';
import { useTheme } from '@/contexts/ThemeContext';

export default function ReflectionScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const date = getLocalDateKey();
  const [content, setContent] = useState('');
  const [entryId, setEntryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dark = isDark;

  const load = useCallback(async () => {
    const rows = await getJournalEntriesForDate(date) as any[];
    if (rows[0]) {
      setContent(rows[0].content || '');
      setEntryId(rows[0].id);
    }
  }, [date]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const save = async () => {
    setBusy(true);
    try {
      if (entryId) await updateJournalEntry(entryId, { content });
      else {
        const id = `journal_${Date.now()}`;
        await createJournalEntry({ id, content, date });
        setEntryId(id);
      }
      Alert.alert('Saved', 'Your reflection is saved on this device.');
    } catch {
      Alert.alert('Could not save', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: dark ? '#0A102C' : '#F4F6FF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.page}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹  Back</Text></Pressable>
        <Text style={[styles.date, { color: dark ? '#AFC0FF' : '#69749A' }]}>
          {new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
            weekday: 'long', month: 'long', day: 'numeric',
          }).toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: dark ? 'white' : '#111943' }]}>Daily reflection</Text>
        <Text style={[styles.prompt, { color: dark ? '#C9D3F3' : '#4D587C' }]}>A moment to reflect</Text>
        <View style={styles.prompts}>
          {['What went well?', 'What could improve?', 'What is tomorrow’s priority?'].map(prompt => (
            <Pressable
              key={prompt}
              onPress={() => setContent(prev => prev.trim() ? `${prev.trim()}\n\n${prompt}\n` : `${prompt}\n`)}
              style={[styles.promptChip, { backgroundColor: dark ? '#17234B' : '#E8EDFF' }]}
            >
              <Text style={{ color: dark ? '#DCE5FF' : '#4059A4', fontSize: 12, fontWeight: '600' }}>{prompt}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.hint, { color: dark ? '#9DA9CC' : '#7F89A8' }]}>Write a little or a lot. Your reflection stays on this device.</Text>
        <TextInput
          multiline
          textAlignVertical="top"
          value={content}
          onChangeText={setContent}
          placeholder="Today, I noticed…"
          placeholderTextColor="#929BB4"
          style={[styles.input, { backgroundColor: dark ? '#141D42' : 'white', color: dark ? 'white' : '#151C45' }]}
        />
        <Pressable disabled={busy} onPress={save} style={styles.button}>
          <Text style={styles.buttonText}>{busy ? 'Saving…' : 'Save reflection'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingTop: 20, paddingBottom: 40 },
  back: { color: '#456AFF', fontWeight: '700' as const, fontSize: 16, marginBottom: 32 },
  date: { fontSize: 11, fontWeight: '800' as const, letterSpacing: 1.2 },
  title: { fontSize: 32, fontWeight: '800' as const, marginTop: 8 },
  prompt: { fontSize: 19, fontWeight: '600' as const, marginTop: 27 },
  prompts: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 12 },
  promptChip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16 },
  hint: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  input: { height: 250, borderRadius: 20, padding: 17, fontSize: 16, lineHeight: 24, marginTop: 20 },
  button: { backgroundColor: '#426CFF', borderRadius: 14, padding: 16, alignItems: 'center' as const, marginTop: 12 },
  buttonText: { color: 'white', fontWeight: '700' as const, fontSize: 16 },
});
