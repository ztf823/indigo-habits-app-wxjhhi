
import AsyncStorage from '@react-native-async-storage/async-storage';

const AFFIRMATIONS_KEY = '@affirmations_cache';

export const defaultAffirmations = [
  "I am capable of achieving my goals",
  "Today is full of possibilities",
  "I choose happiness and peace",
  "I am worthy of love and respect",
  "I trust in my journey"
];

export async function loadAffirmationsOffline() {
  try {
    const cached = await AsyncStorage.getItem(AFFIRMATIONS_KEY);
    return cached ? JSON.parse(cached) : defaultAffirmations;
  } catch {
    return defaultAffirmations;
  }
}

export function getRandomAffirmation(affirmations: string[]) {
  return affirmations[Math.floor(Math.random() * affirmations.length)];
}
