import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { createAffirmation, deleteAffirmation, getAllAffirmations, updateAffirmation } from '@/utils/database';
import { usePremium } from '@/hooks/usePremium';
import { getPlanBasedAffirmation } from '@/utils/affirmations';
import { getPlanForDate, getDayCompletion, getLocalDateKey, PlanEntry, getAffirmationUsage, recordAffirmationRefresh, getDailyAffirmationId, setDailyAffirmationId, getAffirmationSchedules, formatTime } from '@/utils/planner';
import { useTheme } from '@/contexts/ThemeContext';

export default function TodayScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isPro } = usePremium();
  const [items, setItems] = useState<PlanEntry[]>([]);
  const [affirmation, setAffirmation] = useState('');
  const [affirmationId, setAffirmationId] = useState<string | null>(null);
  const [fav, setFav] = useState(false);
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const date = getLocalDateKey();

  const load = useCallback(async () => {
    try {
      const [plan, current, count, schedules] = await Promise.all([
        getPlanForDate(date), getDailyAffirmationId(date), getAffirmationUsage(date), getAffirmationSchedules(),
      ]);
      let allAff = await getAllAffirmations();
      const scheduledIds = new Set(schedules.filter(schedule => schedule.enabled).map(schedule => schedule.affirmationId));
      for (const item of allAff) {
        if (item.id.startsWith('daily_generated_') && item.id !== current && item.isFavorite !== 1 && !scheduledIds.has(item.id)) {
          await deleteAffirmation(item.id);
        }
      }
      allAff = await getAllAffirmations();
      setItems(plan);
      setUsed(count);
      let chosen = allAff.find((item: any) => item.id === current);
      if (!chosen && allAff.length) {
        const text = getPlanBasedAffirmation(plan.map(item => item.title));
        const id = `daily_generated_${date}_${Date.now()}`;
        await createAffirmation({ id, text, isCustom: false, isFavorite: false, isRepeating: false, orderIndex: -1 });
        chosen = { id, text, isFavorite: 0 };
        await setDailyAffirmationId(chosen.id, date);
      } else if (!chosen) {
        const text = getPlanBasedAffirmation(plan.map(item => item.title));
        const id = `daily_generated_${date}_${Date.now()}`;
        await createAffirmation({ id, text, isCustom: false, isFavorite: false, isRepeating: false, orderIndex: -1 });
        chosen = { id, text, isFavorite: 0 };
        await setDailyAffirmationId(id, date);
      }
      if (chosen) {
        setAffirmationId(chosen.id);
        setAffirmation(chosen.text);
        setFav(chosen.isFavorite === 1);
      } else {
        setAffirmationId(null);
        setAffirmation(getPlanBasedAffirmation(plan.map(item => item.title)));
        setFav(false);
      }
    } catch (error) {
      console.warn('[Today] load failed', error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const openNext = () => {
    if (!next) return;
    router.push({ pathname: '/(tabs)/calendar', params: { date, item: next.habitId || next.taskId || '' } } as any);
  };

  const refreshAffirmation = async () => {
    if (!isPro && used >= 3) {
      Alert.alert('That’s today’s limit', 'You can refresh your daily affirmation up to three times a day.');
      return;
    }
    const rows = await getAllAffirmations();
    const schedules = await getAffirmationSchedules();
    const current = rows.find((item: any) => item.id === affirmationId);
    if (current?.id.startsWith('daily_generated_') && current.isFavorite !== 1 && !schedules.some(item => item.affirmationId === current.id && item.enabled)) {
      await deleteAffirmation(current.id);
    }
    const text = getPlanBasedAffirmation(items.map(item => item.title), rows.map((item: any) => item.text));
    const id = `daily_generated_${date}_${Date.now()}`;
    await createAffirmation({ id, text, isCustom: false, isFavorite: false, isRepeating: false, orderIndex: -1 });
    await setDailyAffirmationId(id, date);
    if (!isPro) {
      const count = await recordAffirmationRefresh(date);
      setUsed(count);
    }
    setAffirmationId(id);
    setAffirmation(text);
    setFav(false);
  };

  const toggleFavorite = async () => {
    if (!affirmationId) return;
    const nextFavorite = !fav;
    await updateAffirmation(affirmationId, { isFavorite: nextFavorite });
    setFav(nextFavorite);
  };

  const counts = getDayCompletion(items);
  const next = items.find(item => !item.completed && item.kind !== 'affirmation');
  const surface = isDark ? '#141D42' : '#FFFFFF';
  const primary = isDark ? '#F4F6FF' : '#151C45';
  const secondary = isDark ? '#AEB9D5' : '#7480A6';
  const tint = isDark ? '#C6D7FF' : '#4057DD';
  const percent = counts.total ? Math.round(counts.completed / counts.total * 100) : 0;

  if (loading) return <View style={[s.center, { backgroundColor: isDark ? '#0A102C' : '#F4F6FF' }]}><ActivityIndicator color="#3869FF" /></View>;

  return (
    <LinearGradient colors={isDark ? ['#070B20', '#0A102C', '#101C3D'] : ['#111A78', '#1455D9', '#23B9EB']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.eyebrow}>TODAY</Text>
        <Text style={s.title}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <Text style={s.subtitle}>A little progress, planned with purpose.</Text>

        <View style={[s.progress, { backgroundColor: surface }]}>
          <View style={{ flex: 1 }}>
            <Text style={[s.progressLabel, { color: secondary }]}>TODAY’S PROGRESS</Text>
            <Text style={[s.progressNum, { color: primary }]}>{counts.completed}<Text style={[s.progressTotal, { color: primary }]}> of {counts.total} plan items complete</Text></Text>
            <View style={[s.progressTrack, { backgroundColor: isDark ? '#2B365E' : '#E6E9F4' }]}><View style={[s.progressFill, { width: `${percent}%` }]} /></View>
            <Text style={[s.progressFoot, { color: secondary }]}>{counts.total ? `${percent}% of your plan complete` : 'Your day is yours to shape'}</Text>
            <Pressable onPress={() => router.push({ pathname: '/(tabs)/calendar', params: { date } } as any)} style={[s.progressButton, { backgroundColor: isDark ? '#222E59' : '#F0F1FF' }]}><Text style={{ color: tint, fontWeight: '700' }}>Open today’s plan</Text></Pressable>
          </View>
          <View style={[s.percent, { backgroundColor: isDark ? '#27325C' : '#EEF0FF' }]}><Text style={{ fontSize: 13, fontWeight: '800', color: tint }}>{percent}%</Text></View>
        </View>

        <View style={s.rowHead}>
          <Text style={s.section}>Next up</Text>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/calendar', params: { date } } as any)}><Text style={s.link}>Open calendar</Text></Pressable>
        </View>
        {next ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Open ${next.title} in calendar`} onPress={openNext} style={[s.nextCard, { backgroundColor: isDark ? '#1B2A55' : '#3779E8' }]}>
            <View style={[s.nextIcon, { backgroundColor: next.color || '#6895F0' }]} />
            <View style={{ flex: 1 }}><Text style={s.cardTitle}>{next.title}</Text><Text style={s.meta}>{next.kind === 'task' ? 'One-time task' : next.time ? `Today · ${formatTime(next.time)}` : 'Today'}</Text></View>
            <Text style={s.arrow}>›</Text>
          </Pressable>
        ) : <View style={[s.nextCard, { backgroundColor: isDark ? '#1B2A55' : '#3779E8' }]}><Text style={s.cardTitle}>You’re all caught up ✨</Text></View>}

        <View style={s.quickLinks}>
          <Pressable onPress={() => router.push({ pathname: '/(tabs)/calendar', params: { date } } as any)} style={s.quickButton}><Text style={s.quickText}>Calendar</Text></Pressable>
          <Pressable onPress={() => router.push('/(tabs)/habits' as any)} style={s.quickButton}><Text style={s.quickText}>Manage habits</Text></Pressable>
        </View>

        <View style={s.rowHead}>
          <Text style={s.section}>A thought for today</Text>
          <Pressable onPress={refreshAffirmation}><Text style={s.link}>{isPro ? 'New affirmation' : `New · ${Math.max(0, 3 - used)} left`}</Text></Pressable>
        </View>
        <View style={[s.affirm, { backgroundColor: surface }]}>
          <View style={s.affirmHead}><Text style={[s.affirmFoot, { color: secondary }]}>YOUR DAILY AFFIRMATION</Text><Pressable accessibilityRole="button" accessibilityLabel={fav ? 'Remove from favorites' : 'Add to favorites'} onPress={toggleFavorite}><Text style={{ fontSize: 20, color: '#E4A900' }}>{fav ? '★' : '☆'}</Text></Pressable></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Tap to change this affirmation" onPress={() => affirmationId && router.push({ pathname: '/(tabs)/habits', params: { editAffirmation: affirmationId } } as any)}><Text style={[s.affirmText, { color: primary }]}>{affirmation || 'I am growing at my own pace.'}</Text></Pressable>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 110 },
  eyebrow: { color: '#DCE8FF', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }, title: { color: 'white', fontSize: 28, fontWeight: '800', marginTop: 7 }, subtitle: { color: '#DCE8FF', fontSize: 13, marginTop: 3, marginBottom: 16 },
  progress: { borderRadius: 24, padding: 20, minHeight: 160, flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, progressLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 }, progressNum: { fontSize: 23, fontWeight: '800', marginTop: 8 }, progressTotal: { fontSize: 16, fontWeight: '700' }, progressTrack: { height: 7, borderRadius: 5, marginTop: 13, overflow: 'hidden' }, progressFill: { height: 7, backgroundColor: '#4F5BE7', borderRadius: 5 }, progressFoot: { fontSize: 12, marginTop: 4 }, progressButton: { borderRadius: 12, padding: 11, alignItems: 'center', marginTop: 13 }, percent: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginLeft: 9 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 }, section: { color: 'white', fontSize: 19, fontWeight: '800' }, link: { color: '#DCE8FF', fontWeight: '700', fontSize: 13 },
  nextCard: { borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }, nextIcon: { width: 42, height: 42, borderRadius: 22 }, cardTitle: { color: 'white', fontSize: 15, fontWeight: '700' }, meta: { color: '#DFE9FF', fontSize: 12, marginTop: 4 }, arrow: { color: 'white', fontSize: 27 },
  quickLinks: { flexDirection: 'row', gap: 10, marginBottom: 8 }, quickButton: { flex: 1, backgroundColor: '#3779E8', borderRadius: 14, paddingVertical: 13, alignItems: 'center' }, quickText: { color: 'white', fontSize: 13, fontWeight: '800' },
  affirm: { borderRadius: 22, padding: 18, marginBottom: 12 }, affirmHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, affirmFoot: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800' }, affirmText: { fontSize: 18, lineHeight: 25, fontWeight: '700', marginTop: 10 },
});
