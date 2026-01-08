
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authenticatedGet, authenticatedPost } from "./api";

const AFFIRMATIONS_KEY = "affirmations_library";
const FAVORITES_KEY = "favorite_affirmations";

export const loadAffirmationsOffline = async (): Promise<string[]> => {
  try {
    const stored = await AsyncStorage.getItem(AFFIRMATIONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // TODO: Backend Integration - Fetch from API
    // const response = await authenticatedGet("/api/affirmations/library");
    // await AsyncStorage.setItem(AFFIRMATIONS_KEY, JSON.stringify(response.affirmations));
    // return response.affirmations;
    
    // Fallback affirmations
    const fallback = [
      "I am capable of achieving my goals",
      "Today is full of possibilities",
      "I choose to be happy and grateful",
      "I am growing stronger every day",
      "I trust in my journey"
    ];
    await AsyncStorage.setItem(AFFIRMATIONS_KEY, JSON.stringify(fallback));
    return fallback;
  } catch (error) {
    console.error("Error loading affirmations:", error);
    return ["I am doing my best"];
  }
};

export const getRandomAffirmation = async (): Promise<string> => {
  const affirmations = await loadAffirmationsOffline();
  return affirmations[Math.floor(Math.random() * affirmations.length)];
};

export const saveFavoriteAffirmation = async (affirmation: string): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    const favorites = stored ? JSON.parse(stored) : [];
    
    if (!favorites.includes(affirmation)) {
      favorites.push(affirmation);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      
      // TODO: Backend Integration
      // await authenticatedPost("/api/affirmations/favorites", { affirmation });
    }
  } catch (error) {
    console.error("Error saving favorite:", error);
  }
};
