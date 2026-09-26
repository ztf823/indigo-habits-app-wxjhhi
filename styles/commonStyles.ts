import { StyleSheet } from 'react-native';

export const colors = {
  primary: '#0B5FFF',
  secondary: '#36D7FF',
  accent: '#10B981',
  accentGlow: '#10B98140',
  error: '#EF4444',
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  iconSilver: '#9CA3AF',
  border: '#E5E7EB',
  gradientStart: '#0B5FFF',
  gradientEnd: '#36D7FF',
};

export const darkColors = {
  primary: '#38BDF8',
  secondary: '#67E8F9',
  accent: '#10B981',
  accentGlow: '#10B98160',
  error: '#EF4444',
  background: '#080D2B',
  card: '#111A46',
  text: '#E5E7EB',
  textSecondary: '#9CA3AF',
  iconSilver: '#C0C0C0',
  border: '#24336B',
  gradientStart: '#080D2B',
  gradientEnd: '#102B73',
};

export function getColors(isDark: boolean) {
  return isDark ? darkColors : colors;
}

export const buttonStyles = StyleSheet.create({
  instructionsButton: { backgroundColor: colors.primary, alignSelf: 'center', width: '100%' },
  backButton: { backgroundColor: colors.card, alignSelf: 'center', width: '100%', borderWidth: 1, borderColor: colors.border },
});

export const commonStyles = StyleSheet.create({
  wrapper: { backgroundColor: colors.background, width: '100%', height: '100%' },
  container: { flex: 1, backgroundColor: colors.background, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', maxWidth: 800, width: '100%' },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: colors.text, marginBottom: 10 },
  text: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 8, lineHeight: 24, textAlign: 'center' },
  section: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  buttonContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginVertical: 8, width: '100%', boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)', elevation: 2 },
  icon: { width: 60, height: 60, tintColor: colors.iconSilver },
});
