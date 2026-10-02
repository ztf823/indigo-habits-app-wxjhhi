import React, { useCallback, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { createAffirmation, deleteAffirmation, getAllAffirmations, setHabitCompletion, updateAffirmation } from '@/utils/database';
import { usePremium } from '@/hooks/usePremium';
import { DEFAULT_AFFIRMATIONS } from '@/utils/affirmations';
import { getPlanForDate, getDayCompletion, getLocalDateKey, PlanEntry, getAffirmationUsage, recordAffirmationRefresh, getDailyAffirmationIds, setDailyAffirmationIds, getAffirmationSchedules, formatTime, setPlannedItemCompleted, setAffirmationPlanEntryCompleted } from '@/utils/planner';
import { useTheme } from '@/contexts/ThemeContext';

type AffirmationCard = { id: string; text: string; favorite: boolean; scheduled?: PlanEntry[] };

export default function TodayScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isPro } = usePremium();
  const [items, setItems] = useState<PlanEntry[]>([]);
  const [affirmations, setAffirmations] = useState<AffirmationCard[]>([]);
  const [activeAffirmationIndex, setActiveAffirmationIndex] = useState(0);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const completionNoticeShownFor = useRef<string | null>(null);
  const date = getLocalDateKey();

  const load = useCallback(async () => {
    try {
      const [plan, count, schedules] = await Promise.all([
        getPlanForDate(date), getAffirmationUsage(date), getAffirmationSchedules(),
      ]);
      const savedTodayIds = new Set(await getDailyAffirmationIds(date));
      const scheduledLibraryIds = new Set(schedules.filter(schedule => schedule.enabled).map(schedule => schedule.affirmationId));
      let library = await getAllAffirmations() as any[];
      for (const row of library) {
        if (row.id.startsWith('daily_generated_') && !savedTodayIds.has(row.id) && row.isFavorite !== 1 && !scheduledLibraryIds.has(row.id)) {
          await deleteAffirmation(row.id);
        }
      }
      library = await getAllAffirmations() as any[];
      if (!library.length) {
        const defaults = DEFAULT_AFFIRMATIONS.slice(0, 3);
        for (let index = 0; index < defaults.length; index++) {
          const id = `daily_library_${index + 1}`;
          try { await createAffirmation({ id, text: defaults[index], isCustom: false, isFavorite: false, isRepeating: false, orderIndex: index }); } catch { /* Another launch may already have seeded the library. */ }
        }
        library = await getAllAffirmations() as any[];
      }
      const scheduled = plan.filter(item => item.kind === 'affirmation');
      const scheduledById = new Map<string, PlanEntry[]>();
      for (const item of scheduled) {
        if (!item.affirmationId) continue;
        scheduledById.set(item.affirmationId, [...(scheduledById.get(item.affirmationId) || []), item]);
      }
      const scheduledIds = [...scheduledById.keys()];
      const automaticLimit = isPro ? 3 : Math.max(0, 3 - scheduledIds.length);
      let selectedIds = await getDailyAffirmationIds(date);
      selectedIds = selectedIds.filter(id => library.some(row => row.id === id) && !scheduledById.has(id)).slice(0, automaticLimit);
      if (selectedIds.length < automaticLimit) {
        const candidates = library.filter(row => !scheduledById.has(row.id) && !selectedIds.includes(row.id));
        for (let index = candidates.length - 1; index > 0; index--) {
          const swap = Math.floor(Math.random() * (index + 1));
          [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
        }
        selectedIds.push(...candidates.slice(0, automaticLimit - selectedIds.length).map(row => row.id));
        await setDailyAffirmationIds(selectedIds, date);
      }
      const cards: AffirmationCard[] = [
        ...scheduledIds.flatMap(id => {
          const row = library.find(candidate => candidate.id === id);
          return row ? [{ id, text: row.text, favorite: row.isFavorite === 1, scheduled: scheduledById.get(id) }] : [];
        }),
        ...selectedIds.flatMap(id => {
          const row = library.find(candidate => candidate.id === id);
          return row ? [{ id, text: row.text, favorite: row.isFavorite === 1 }] : [];
        }),
      ];
      const limitedCards = isPro ? cards : cards.slice(0, 3);
      setItems(plan);
      setAffirmations(limitedCards);
      setActiveAffirmationIndex(index => limitedCards.length ? index % limitedCards.length : 0);
      setUsed(count);
    } catch (error) {
      console.warn('[Today] load failed', error);
    } finally {
      setLoading(false);
    }
  }, [date, isPro]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const completeNext = async () => {
    if (!next) return;
    try {
      if (next.kind === 'habit' && next.habitId) await setHabitCompletion(next.habitId, date, true);
      if (next.kind === 'task' && next.taskId) await setPlannedItemCompleted(next.taskId, date, true);
      if (next.kind === 'affirmation') await setAffirmationPlanEntryCompleted(next.id, date, true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await load();
    } catch {
      Alert.alert('Could not update plan', 'Please try again.');
    }
  };

  const refreshAffirmation = async () => {
    if (!isPro && used >= 3) {
      Alert.alert('That’s today’s limit', 'You can refresh your daily affirmations up to three times a day.');
      return;
    }
    const library = await getAllAffirmations() as any[];
    const schedules = await getAffirmationSchedules();
    const scheduledIds = new Set(schedules.filter(schedule => schedule.enabled).map(schedule => schedule.affirmationId));
    const usedToday = new Set(await getDailyAffirmationIds(date));
    const next = library.find(row => !scheduledIds.has(row.id) && !usedToday.has(row.id));
    if (!next) {
      Alert.alert('You’ve seen today’s affirmations', 'Your saved affirmations are all in today’s selection. Add or save more affirmations to keep a daily rotation.');
      return;
    }
    const currentIds = await getDailyAffirmationIds(date);
    if (currentIds.length) currentIds[0] = next.id;
    else currentIds.push(next.id);
    await setDailyAffirmationIds(currentIds, date);
    if (!isPro) setUsed(await recordAffirmationRefresh(date));
    await load();
  };

  const toggleFavorite = async (card: AffirmationCard) => {
    const favorite = !card.favorite;
    await updateAffirmation(card.id, { isFavorite: favorite });
    setAffirmations(current => current.map(item => item.id === card.id ? { ...item, favorite } : item));
  };

  const advanceAffirmation = async () => {
    if (affirmations.length < 2) return;
    const isCyclingPastLast = activeAffirmationIndex === affirmations.length - 1;
    setActiveAffirmationIndex(index => (index + 1) % affirmations.length);
    const scheduled = items.filter(item => item.kind === 'affirmation');
    if (!isCyclingPastLast || !scheduled.length || !scheduled.every(item => item.completed) || completionNoticeShownFor.current === date) return;
    const completionKey = `@indigo_habits/affirmations_completed_notice/${date}`;
    completionNoticeShownFor.current = date;
    if (await AsyncStorage.getItem(completionKey) === 'shown') return;
    await AsyncStorage.setItem(completionKey, 'shown');
    Alert.alert('Affirmations complete', 'You completed all of today’s scheduled affirmations. You can keep revisiting them.');
  };

  const counts = getDayCompletion(items);
  const next = items.find(item => !item.completed);
  const surface = isDark ? '#141D42' : '#FFFFFF';
  const primary = isDark ? '#F4F6FF' : '#151C45';
  const secondary = isDark ? '#AEB9D5' : '#7480A6';
  const tint = isDark ? '#C6D7FF' : '#4057DD';
  const percent = counts.total ? Math.round(counts.completed / counts.total * 100) : 0;
  const scheduledAffirmations = items.filter(item => item.kind === 'affirmation');
  const scheduledAffirmationsComplete = scheduledAffirmations.length > 0 && scheduledAffirmations.every(item => item.completed);
  const activeAffirmation = affirmations[activeAffirmationIndex];

  if (loading) return <View style={[s.center, { backgroundColor: isDark ? '#0A102C' : '#F4F6FF' }]}><ActivityIndicator color="#3869FF" /></View>;

  return (
    <LinearGradient colors={isDark ? ['#070B20', '#0A102C', '#101C3D'] : ['#5B70D5', '#1455D9', '#23B9EB']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>TODAY</Text>
        <Text style={s.title}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <Text style={s.subtitle}>A little progress, planned with purpose.</Text>
        <View style={[s.progress, { backgroundColor: surface }]}>
          <View style={{ flex: 1 }}><Text style={[s.progressLabel, { color: secondary }]}>TODAY’S PROGRESS</Text><Text style={[s.progressNum, { color: primary }]}>{counts.completed}<Text style={[s.progressTotal, { color: primary }]}> of {counts.total} plan items complete</Text></Text><View style={[s.progressTrack, { backgroundColor: isDark ? '#2B365E' : '#E6E9F4' }]}><View style={[s.progressFill, { width: `${percent}%` }]} /></View><Text style={[s.progressFoot, { color: secondary }]}>{counts.total ? `${percent}% of your plan complete` : 'Your day is yours to shape'}</Text><Pressable onPress={() => router.push({ pathname: '/(tabs)/calendar', params: { date } } as any)} style={[s.progressButton, { backgroundColor: isDark ? '#222E59' : '#F0F1FF' }]}><Text style={{ color: tint, fontWeight: '700' }}>Open today’s plan</Text></Pressable></View>
          <View style={[s.percent, { backgroundColor: isDark ? '#27325C' : '#EEF0FF' }]}><Text style={{ fontSize: 13, fontWeight: '800', color: tint }}>{percent}%</Text></View>
        </View>
        <View style={s.rowHead}><Text style={s.section}>Next up</Text></View>
        {next ? <Pressable accessibilityRole="button" accessibilityLabel={`Mark ${next.title} complete`} onPress={completeNext} style={[s.nextCard, { backgroundColor: isDark ? '#1B2A55' : '#3779E8' }]}><View style={[s.nextIcon, { backgroundColor: next.color || '#6895F0' }]} /><View style={{ flex: 1 }}><Text style={s.cardTitle}>{next.title}</Text><Text style={s.meta}>{next.kind === 'task' ? 'One-time task' : next.time ? `Today · ${formatTime(next.time)}` : 'Today'}</Text></View><Text style={s.tapForNext}>Tap for next</Text></Pressable> : <View style={[s.nextCard, { backgroundColor: isDark ? '#1B2A55' : '#3779E8' }]}><Text style={s.cardTitle}>You’re all caught up ✨</Text></View>}
        <View style={s.quickLinks}><Pressable onPress={() => router.push({ pathname: '/(tabs)/calendar', params: { date } } as any)} style={s.quickButton}><Text style={s.quickText}>Calendar</Text></Pressable><Pressable onPress={() => router.push('/(tabs)/habits' as any)} style={s.quickButton}><Text style={s.quickText}>Manage habits</Text></Pressable></View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/voice-plan' as any)} style={s.voicePlanButton}><Text style={s.quickText}>Plan Your Day (Voice)</Text></Pressable>
        <View style={s.rowHead}><Text style={s.section}>Speak Out Loud</Text><Pressable accessibilityRole="button" onPress={refreshAffirmation} hitSlop={8}><Text style={s.link}>{scheduledAffirmationsComplete ? 'Replay scheduled affirmations' : isPro ? 'New affirmation' : `New · ${Math.max(0, 3 - used)} left`}</Text></Pressable></View>
        {activeAffirmation ? <View key={activeAffirmation.id} style={[s.affirm, { backgroundColor: surface }]}><View style={s.affirmHead}><Text style={[s.affirmFoot, { color: secondary }]}>{activeAffirmation.scheduled ? 'SCHEDULED AFFIRMATION' : 'YOUR DAILY AFFIRMATION'}</Text><View style={s.cardActions}><Pressable accessibilityRole="button" accessibilityLabel={activeAffirmation.favorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => void toggleFavorite(activeAffirmation)} hitSlop={8}><Text style={{ fontSize: 20, color: '#E4A900' }}>{activeAffirmation.favorite ? '★' : '☆'}</Text></Pressable></View></View><Pressable accessibilityRole="button" accessibilityLabel={`Affirmation ${activeAffirmationIndex + 1} of ${affirmations.length}. Tap to see the next affirmation.`} onPress={advanceAffirmation} disabled={affirmations.length < 2}><Text style={[s.affirmText, { color: primary }]}>{activeAffirmation.text}</Text>{affirmations.length > 1 && <Text style={[s.affirmHint, { color: secondary }]}>{activeAffirmationIndex + 1} of {affirmations.length} · Tap for next</Text>}</Pressable></View> : <View style={[s.affirm, { backgroundColor: surface }]}><Text style={[s.affirmText, { color: primary }]}>Add affirmations to your library to fill today’s slots.</Text></View>}
        <View style={s.rowHead}><Text style={s.section}>Write an Entry</Text></View>
        <Pressable accessibilityRole="button" onPress={() => router.push('/reflection' as any)} style={[s.journalCard, { backgroundColor: surface }]}><Text style={[s.journalText, { color: primary }]}>Take a moment to reflect on your day.</Text><Text style={{ color: tint, fontWeight: '700' }}>Open journal  ›</Text></Pressable>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 }, eyebrow: { color: '#DCE8FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { color: 'white', fontSize: 28, fontWeight: '800', marginTop: 7 }, subtitle: { color: '#DCE8FF', fontSize: 13, marginTop: 3, marginBottom: 16 },
  progress: { borderRadius: 24, padding: 20, minHeight: 160, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, progressNum: { fontSize: 23, fontWeight: '800', marginTop: 8 }, progressTotal: { fontSize: 16, fontWeight: '700' }, progressTrack: { height: 7, borderRadius: 5, marginTop: 13, overflow: 'hidden' }, progressFill: { height: 7, backgroundColor: '#4F5BE7', borderRadius: 5 }, progressFoot: { fontSize: 12, marginTop: 4 }, progressButton: { borderRadius: 12, padding: 11, alignItems: 'center', marginTop: 13 }, percent: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginLeft: 9 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 }, section: { color: 'white', fontSize: 19, fontWeight: '800' }, link: { color: '#DCE8FF', fontWeight: '700', fontSize: 13 }, nextCard: { borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }, nextIcon: { width: 42, height: 42, borderRadius: 22 }, cardTitle: { color: 'white', fontSize: 15, fontWeight: '700' }, meta: { color: '#DFE9FF', fontSize: 12, marginTop: 4 }, tapForNext: { color: '#DBE5FF99', fontSize: 10, fontWeight: '600' },
  quickLinks: { flexDirection: 'row', gap: 10, marginBottom: 8 }, quickButton: { flex: 1, backgroundColor: '#3779E8', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }, quickText: { color: 'white', fontSize: 13, fontWeight: '800' }, voicePlanButton: { backgroundColor: '#3779E8', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginBottom: 8 }, affirm: { borderRadius: 22, padding: 18, marginBottom: 12 }, affirmHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 }, affirmFoot: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800' }, affirmText: { fontSize: 18, lineHeight: 25, fontWeight: '700', marginTop: 10 }, affirmHint: { fontSize: 11, fontWeight: '600', marginTop: 9 }, completeMark: { fontSize: 22, lineHeight: 24 }, journalCard: { borderRadius: 18, padding: 18, marginBottom: 12, gap: 12 }, journalText: { fontSize: 15, fontWeight: '600' },
});
