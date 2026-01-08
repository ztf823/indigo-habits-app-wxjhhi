
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export async function playCompletionChime() {
  // Play haptic feedback as a substitute for audio chime
  if (Platform.OS !== "web") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
  
  // TODO: Backend Integration - Add audio file for soft chime sound
  // For now, we use haptic feedback which provides a nice tactile response
  console.log("Completion chime played");
}

export async function playSuccessHaptic() {
  if (Platform.OS !== "web") {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export async function playImpactHaptic() {
  if (Platform.OS !== "web") {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}
