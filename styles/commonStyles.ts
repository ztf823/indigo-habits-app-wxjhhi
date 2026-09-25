
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Brand colors are reserved for Indigo Habits surfaces and action controls.
// Keep success, warning, and destructive feedback colors semantic.
export const brandColors = {
  navy: '#0B0B5C',
  indigo: '#2637D9',
  electricBlue: '#149BFF',
  flame: '#35D9F3',
  softIndigo: '#E8ECFF',
  midnight: '#07073D',
};

export const colors = {
  primary: '#2637D9',        // Blue flame indigo
  secondary: '#35D9F3',      // Flame cyan
  accent: '#10B981',         // Green for completed habits
  accentGlow: '#10B98140',   // Soft green glow (25% opacity)
  error: '#EF4444',          // Red for missed habits
  background: '#FFFFFF',     // Pure white
  card: '#FFFFFF',           // Pure white cards
  text: '#1F2937',           // Dark gray text
  textSecondary: '#6B7280',  // Secondary gray text
  iconSilver: '#9CA3AF',     // Silver icons
  border: '#E5E7EB',         // Light border
  gradientStart: '#0B0B5C',  // Deep flame indigo
  gradientEnd: '#149BFF',    // Electric blue
};

// Dark mode colors - indigo-dark base with silver icons and soft glows
export const darkColors = {
  primary: '#35D9F3',        // Flame cyan for dark mode
  secondary: '#149BFF',      // Electric blue
  accent: '#10B981',         // Green for completed habits
  accentGlow: '#10B98160',   // Soft green glow (38% opacity for dark mode)
  error: '#EF4444',          // Red for missed habits
  background: '#0B0B5C',     // Deep flame indigo base
  card: '#151778',           // Slightly lighter indigo card
  text: '#E5E7EB',           // Light gray text (readable on dark)
  textSecondary: '#9CA3AF',  // Silver text
  iconSilver: '#C0C0C0',     // Silver icons
  border: '#2637D9',         // Blue flame border
  gradientStart: '#0B0B5C',  // Deep flame indigo
  gradientEnd: '#2637D9',    // Flame indigo
};

export function getColors(isDark: boolean) {
  return isDark ? darkColors : colors;
}

export const buttonStyles = StyleSheet.create({
  instructionsButton: {
    backgroundColor: colors.primary,
    alignSelf: 'center',
    width: '100%',
  },
  backButton: {
    backgroundColor: colors.card,
    alignSelf: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export const commonStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 800,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
    marginBottom: 10
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    width: '100%',
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  icon: {
    width: 60,
    height: 60,
    tintColor: colors.iconSilver,
  },
});
