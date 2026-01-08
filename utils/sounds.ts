
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

export const playCompletionChime = async () => {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
      { shouldPlay: true, volume: 0.5 }
    );
    await sound.playAsync();
  } catch (error) {
    console.log("Error playing sound:", error);
  }
};

export const playSuccessHaptic = () => {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};
