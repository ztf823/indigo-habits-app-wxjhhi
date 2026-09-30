import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { formatTime, timeToDate, timeToString } from '@/utils/planner';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  darkMode?: boolean;
};

export default function TimePickerField({
  value,
  onChange,
  placeholder = 'Choose a time',
  textColor = '#151C45',
  backgroundColor = '#F3F4F6',
  borderColor = '#DCE1EF',
  darkMode = false,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState(() => timeToDate(value) ?? timeToDate('09:00')!);

  const open = () => {
    setDraft(timeToDate(value) ?? timeToDate('09:00')!);
    setVisible(true);
  };

  const onPickerChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setDraft(selected);
  };

  const finish = () => {
    onChange(timeToString(draft));
    setVisible(false);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={value ? `Time ${formatTime(value)}` : placeholder}
        onPress={open}
        style={[styles.field, { backgroundColor, borderColor }]}
      >
        <Text style={[styles.value, { color: value ? textColor : '#8A93AE' }]}>
          {value ? formatTime(value) : placeholder}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.scrim}>
          <View style={[styles.sheet, darkMode && styles.sheetDark]}>
            <View style={styles.header}>
              <Pressable accessibilityRole="button" onPress={() => setVisible(false)}>
                <Text style={[styles.cancel, darkMode && { color: '#C6D7FF' }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.title, darkMode && { color: '#F4F6FF' }]}>Set time</Text>
              <Pressable accessibilityRole="button" onPress={finish}>
                <Text style={[styles.done, darkMode && { color: '#8FA8FF' }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="time"
              display="spinner"
              locale={Platform.OS === 'ios' ? 'en_US' : undefined}
              is24Hour={false}
              minuteInterval={1}
              onChange={onPickerChange}
              textColor={darkMode ? '#F4F6FF' : '#151C45'}
              themeVariant={darkMode ? 'dark' : 'light'}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { fontSize: 15, fontWeight: '600' },
  chevron: { color: '#65708F', fontSize: 20, marginTop: -5 },
  scrim: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  sheetDark: { backgroundColor: '#141D42' },
  header: {
    minHeight: 54,
    paddingHorizontal: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DCE1EF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#151C45', fontSize: 16, fontWeight: '700' },
  cancel: { color: '#65708F', fontSize: 15 },
  done: { color: '#4057DD', fontSize: 15, fontWeight: '700' },
  picker: { alignSelf: 'stretch' },
});
