
import { useState, useEffect, useCallback } from "react";
import { usePlacement, useUser } from "expo-superwall";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function usePremium() {
  const [isPro, setIsPro] = useState(false);
  const { subscriptionStatus } = useUser();
  const { registerPlacement } = usePlacement({
    onPresent: (info) => console.log("Paywall presented:", info),
    onDismiss: (info, result) => {
      console.log("Paywall dismissed:", result);
      // Check subscription status after dismissal
      checkProStatus();
    },
  });

  const checkProStatus = useCallback(async () => {
    // Check Superwall subscription status
    const isActive = subscriptionStatus?.status === "ACTIVE";
    setIsPro(isActive);
    await AsyncStorage.setItem("isPro", JSON.stringify(isActive));
  }, [subscriptionStatus]);

  useEffect(() => {
    checkProStatus();
  }, [checkProStatus]);

  const showPaywall = async () => {
    await registerPlacement({
      placement: "pro_upgrade",
      feature: () => {
        console.log("User has Pro access!");
        setIsPro(true);
      },
    });
  };

  return {
    isPro,
    showPaywall,
  };
}
