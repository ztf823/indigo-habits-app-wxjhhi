
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authenticatedGet } from "@/utils/api";

const PREMIUM_KEY = "user_premium_status";

export const usePremium = () => {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkProStatus = useCallback(async () => {
    try {
      // Check local storage first
      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (stored) {
        setIsPro(JSON.parse(stored));
      }
      
      // TODO: Backend Integration - Check with API
      // const response = await authenticatedGet("/api/user/premium-status");
      // setIsPro(response.isPremium);
      // await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(response.isPremium));
      
      setLoading(false);
    } catch (error) {
      console.error("Error checking premium status:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkProStatus();
  }, [checkProStatus]);

  const upgradeToPro = async () => {
    // TODO: Backend Integration - Process purchase
    // await authenticatedPost("/api/user/purchase", { plan: "pro" });
    setIsPro(true);
    await AsyncStorage.setItem(PREMIUM_KEY, JSON.stringify(true));
  };

  const showPaywall = () => {
    // TODO: Backend Integration - Show Superwall paywall
    // For now, just upgrade directly
    upgradeToPro();
  };

  return { isPro, loading, upgradeToPro, showPaywall, refreshStatus: checkProStatus };
};
