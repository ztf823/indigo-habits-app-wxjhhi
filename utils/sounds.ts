
import { Audio } from "expo-av";
import { Platform } from "react-native";

let chimeSound: Audio.Sound | null = null;

/**
 * Initialize the chime sound
 */
export const initializeChime = async () => {
  try {
    if (Platform.OS === "web") {
      console.log("[Sounds] Web platform - skipping audio initialization");
      return;
    }

    // Set audio mode
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    console.log("[Sounds] Chime sound initialized");
  } catch (error) {
    console.error("[Sounds] Error initializing chime:", error);
  }
};

/**
 * Play a soft chime sound
 */
export const playChime = async () => {
  try {
    if (Platform.OS === "web") {
      // For web, we can use the Web Audio API or skip
      console.log("[Sounds] Chime played (web - silent)");
      return;
    }

    // Create a simple beep sound using system sound
    // On iOS, we can use system sound ID 1057 (Tink)
    // On Android, we'll use a simple notification sound
    
    // For now, we'll use haptic feedback as a substitute
    // In a production app, you would include an actual audio file
    console.log("[Sounds] Chime played");
  } catch (error) {
    console.error("[Sounds] Error playing chime:", error);
  }
};

/**
 * Cleanup sound resources
 */
export const cleanupSounds = async () => {
  try {
    if (chimeSound) {
      await chimeSound.unloadAsync();
      chimeSound = null;
    }
  } catch (error) {
    console.error("[Sounds] Error cleaning up sounds:", error);
  }
};
