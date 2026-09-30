import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/contexts/ThemeContext";
import { createHabit } from "@/utils/database";
import { addPlannedItem, ALL_DAYS, HabitSchedule, makeId, normalizeTime, saveHabitSchedule } from "@/utils/planner";
import { parseVoicePlan, parseVoiceRecurrence, VoicePlanDraft } from "@/utils/voicePlanner";
import TimePickerField from "@/components/TimePickerField";
import { scheduleHabitReminder, scheduleTaskReminder } from "@/utils/notifications";

export default function VoicePlanScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [transcript, setTranscript] = useState("");
  const [drafts, setDrafts] = useState<VoicePlanDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [remind, setRemind] = useState(false);
  const colors = {
    background: isDark ? ["#070B20", "#0A102C", "#101C3D"] : ["#111A78", "#1455D9", "#23B9EB"],
    card: isDark ? "#141D42" : "#FFFFFF",
    text: isDark ? "#F4F6FF" : "#151C45",
    muted: isDark ? "#AEB9D5" : "#7480A6",
    input: isDark ? "#202B52" : "#F5F7FC",
  } as const;

  const createReview = () => {
    const parsed = parseVoicePlan(transcript);
    if (!parsed.length) {
      Alert.alert("Nothing to schedule yet", "Speak or type a task, habit, date, or time, then review it.");
      return;
    }
    setDrafts(parsed);
  };

  const updateDraft = (id: string, changes: Partial<VoicePlanDraft>) => {
    setDrafts(current => current.map(draft => draft.id === id ? { ...draft, ...changes } : draft));
  };

  const confirmPlan = async () => {
    const invalid = drafts.find(draft => !draft.title.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || (draft.time && !normalizeTime(draft.time)));
    if (!drafts.length) return;
    if (invalid) {
      Alert.alert("Check the plan", "Each item needs a title, a YYYY-MM-DD date, and a valid time.");
      return;
    }
    setSaving(true);
    try {
      for (const draft of drafts) {
        const id = makeId(draft.kind === "habit" ? "habit" : "task");
        const time = normalizeTime(draft.time) || "";
        if (draft.kind === "task") {
          await addPlannedItem({ id, title: draft.title.trim(), date: draft.date, time, reminderEnabled: false });
          if (remind && time) await scheduleTaskReminder(id, draft.title.trim(), draft.date, time);
          continue;
        }
        const recurrence = parseVoiceRecurrence(draft.recurrence, draft.date);
        const recurringDays = recurrence.days.length ? recurrence.days : (draft.days.length ? draft.days : ALL_DAYS);
        const interval = recurrence.intervalMinutes;
        const startTime = time || (interval ? "09:00" : "");
        const endTime = interval ? normalizeTime(draft.endTime) || "21:00" : undefined;
        await createHabit({ id, title: draft.title.trim(), color: "#4F73FF", isRepeating: true, orderIndex: 0 });
        const schedule: HabitSchedule = {
          days: recurringDays,
          time: startTime,
          reminderEnabled: remind && !!startTime,
          paused: false,
          startDate: draft.date,
          ...(interval ? { repeatEveryMinutes: interval, endTime } : {}),
        };
        await saveHabitSchedule(id, schedule);
        if (schedule.reminderEnabled) {
          const reminderTimes = interval ? intervalTimes(startTime, endTime || "21:00", interval) : startTime;
          await scheduleHabitReminder(id, draft.title.trim(), reminderTimes, recurringDays);
        }
      }
      Alert.alert("Plan added", `${drafts.length} ${drafts.length === 1 ? "item is" : "items are"} now in your Indigo Habits schedule.`, [
        { text: "Open today’s plan", onPress: () => router.replace({ pathname: "/(tabs)/calendar", params: { date: drafts[0].date } } as any) },
      ]);
      setDrafts([]);
    } catch (error) {
      console.error("Could not save the voice plan", error);
      Alert.alert("Could not save plan", "Please check the proposed items and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient colors={colors.background as unknown as [string, string, ...string[]]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹  More</Text></Pressable>
        <Text style={styles.eyebrow}>VOICE PLANNING</Text>
        <Text style={styles.heading}>Plan Your Day (Voice)</Text>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.muted }]}>YOUR PLAN</Text>
          <TextInput
            accessibilityLabel="Spoken or typed schedule description"
            value={transcript}
            onChangeText={setTranscript}
            multiline
            placeholder="Use your keyboard dictation to describe your plan. Example: Tomorrow, work out at 7 AM and journal at 9 PM."
            placeholderTextColor={colors.muted}
            style={[styles.transcript, { color: colors.text, backgroundColor: colors.input }]}
          />
          <View style={styles.actions}>
            <Pressable onPress={createReview} style={styles.reviewButton}><Text style={styles.reviewText}>Review plan</Text></Pressable>
          </View>
        </View>

        {drafts.length > 0 && <>
          <Text style={styles.sectionHeading}>Review before saving</Text>
          <Text style={styles.sectionNote}>Correct the title, date, time, or recurrence. Nothing is added until you confirm.</Text>
          {drafts.map((draft, index) => {
            const interval = parseVoiceRecurrence(draft.recurrence, draft.date).intervalMinutes;
            return <View key={draft.id} style={[styles.draftCard, { backgroundColor: colors.card }]}>
              <View style={styles.draftHeader}><Text style={[styles.cardLabel, { color: colors.muted }]}>ITEM {index + 1}</Text><Pressable onPress={() => setDrafts(items => items.filter(item => item.id !== draft.id))}><Text style={styles.remove}>Remove</Text></Pressable></View>
              <TextInput value={draft.title} onChangeText={title => updateDraft(draft.id, { title })} placeholder="Item title" placeholderTextColor={colors.muted} style={[styles.field, { color: colors.text, backgroundColor: colors.input }]} />
              <View style={styles.typeRow}>
                {(["task", "habit"] as const).map(kind => <Pressable key={kind} onPress={() => updateDraft(draft.id, kind === "task" ? { kind, days: [], recurrence: "One time", intervalMinutes: undefined, endTime: undefined } : { kind, days: ALL_DAYS, recurrence: "Daily" })} style={[styles.typeOption, draft.kind === kind && styles.typeOptionActive]}><Text style={[styles.typeText, draft.kind === kind && styles.typeTextActive]}>{kind === "task" ? "One-time task" : "Recurring habit"}</Text></Pressable>)}
              </View>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>DATE · YYYY-MM-DD</Text>
              <TextInput value={draft.date} onChangeText={date => updateDraft(draft.id, { date })} autoCapitalize="none" placeholder="2026-09-30" placeholderTextColor={colors.muted} style={[styles.field, { color: colors.text, backgroundColor: colors.input }]} />
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>TIME</Text>
              <TimePickerField value={draft.time} onChange={time => updateDraft(draft.id, { time })} placeholder="Choose a time" textColor={colors.text} backgroundColor={colors.input} borderColor={isDark ? "#34416B" : "#DCE1EF"} darkMode={isDark} />
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>RECURRENCE</Text>
              <TextInput editable={draft.kind === "habit"} value={draft.kind === "task" ? "One time" : draft.recurrence} onChangeText={recurrence => updateDraft(draft.id, { recurrence })} placeholder="Daily, weekdays, every 2 hours" placeholderTextColor={colors.muted} style={[styles.field, { color: colors.text, backgroundColor: colors.input, opacity: draft.kind === "task" ? 0.7 : 1 }]} />
              {interval && draft.kind === "habit" && <><Text style={[styles.fieldLabel, { color: colors.muted }]}>REPEAT UNTIL</Text><TimePickerField value={draft.endTime || "21:00"} onChange={endTime => updateDraft(draft.id, { endTime })} placeholder="9:00 PM" textColor={colors.text} backgroundColor={colors.input} borderColor={isDark ? "#34416B" : "#DCE1EF"} darkMode={isDark} /><Text style={[styles.note, { color: colors.muted }]}>The interval repeats from the start time through this time each selected day.</Text></>}
            </View>;
          })}
          <View style={styles.reminderRow}><Text style={styles.reminderText}>Set reminders for timed items</Text><Switch value={remind} onValueChange={setRemind} /></View>
          <Pressable disabled={saving} onPress={confirmPlan} style={[styles.confirmButton, saving && { opacity: 0.7 }]}>{saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.confirmText}>Confirm and add to schedule</Text>}</Pressable>
        </>}
      </ScrollView>
    </LinearGradient>
  );
}

const intervalTimes = (start: string, end: string, interval: number) => {
  const toMinutes = (value: string) => { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; };
  const from = toMinutes(start); const through = toMinutes(end); const result: string[] = [];
  for (let minute = from; minute <= through; minute += interval) result.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
  return result;
};

const styles = StyleSheet.create({
  container: { flex: 1 }, content: { padding: 20, paddingTop: 54, paddingBottom: 125 }, back: { marginBottom: 24 }, backText: { color: "#DCE8FF", fontSize: 16, fontWeight: "700" },
  eyebrow: { color: "#DCE8FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.6 }, heading: { color: "white", fontSize: 32, fontWeight: "800", marginTop: 7 }, intro: { color: "#DCE8FF", fontSize: 14, lineHeight: 21, marginTop: 7, marginBottom: 18 },
  card: { borderRadius: 20, padding: 18, marginBottom: 18 }, cardLabel: { fontSize: 10, letterSpacing: 1.2, fontWeight: "800" }, transcript: { minHeight: 112, textAlignVertical: "top", borderRadius: 13, padding: 13, marginTop: 11, fontSize: 15, lineHeight: 22 }, actions: { flexDirection: "row", gap: 10, marginTop: 12 }, reviewButton: { flex: 1, borderRadius: 12, padding: 13, alignItems: "center", backgroundColor: "#426CFF" }, reviewText: { color: "white", fontWeight: "800" }, note: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  sectionHeading: { color: "white", fontSize: 20, fontWeight: "800", marginTop: 3 }, sectionNote: { color: "#DCE8FF", fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 11 }, draftCard: { borderRadius: 18, padding: 16, marginBottom: 12, gap: 8 }, draftHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }, remove: { color: "#D8445B", fontWeight: "700", fontSize: 12 }, field: { borderRadius: 11, padding: 12, fontSize: 14, marginTop: 5 }, fieldLabel: { fontSize: 10, letterSpacing: 1, fontWeight: "800", marginTop: 8 }, typeRow: { flexDirection: "row", gap: 8, marginVertical: 3 }, typeOption: { flex: 1, borderWidth: 1, borderColor: "#DCE1EF", borderRadius: 11, padding: 10, alignItems: "center" }, typeOptionActive: { backgroundColor: "#426CFF", borderColor: "#426CFF" }, typeText: { color: "#66708C", fontSize: 12, fontWeight: "700" }, typeTextActive: { color: "white" }, reminderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 10 }, reminderText: { color: "white", fontWeight: "700", fontSize: 14 }, confirmButton: { borderRadius: 14, padding: 16, alignItems: "center", backgroundColor: "#426CFF" }, confirmText: { color: "white", fontSize: 15, fontWeight: "800" },
});
