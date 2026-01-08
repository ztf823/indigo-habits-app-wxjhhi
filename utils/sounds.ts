
import * as Haptics from 'expo-haptics';

export async function playCompletionChime() {
  try {
    // Play haptic feedback as a substitute for audio chime
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.log('Error playing haptic:', error);
  }
}

export async function playSuccessHaptic() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
