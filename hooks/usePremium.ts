
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getCustomerInfo } from '@/utils/revenueCat';

const PREMIUM_KEY = '@indigo_habits_premium';

export function usePremium() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPremiumStatus = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[usePremium] Loading premium status...');
      
      // On web, check AsyncStorage only
      if (Platform.OS === 'web') {
        const stored = await AsyncStorage.getItem(PREMIUM_KEY);
        const isProStored = stored === 'true';
        setIsPro(isProStored);
        console.log('[usePremium] Web platform - Premium status from storage:', isProStored);
        return;
      }
      
      // Native entitlement state comes from RevenueCat. Do not revoke or grant
      // access from a stale cache when the SDK/network is temporarily unavailable.
      const result = await getCustomerInfo();
      if (result.status === 'unavailable') {
        console.warn('[usePremium] Subscription status unavailable; retaining current state.');
        return;
      }

      await AsyncStorage.setItem(PREMIUM_KEY, result.isPro.toString());
      setIsPro(result.isPro);
    } catch (error) {
      console.error('[usePremium] Error loading premium status:', error);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPremiumStatus();
  }, [loadPremiumStatus]);

  const checkProStatusCallback = useCallback(async () => {
    await loadPremiumStatus();
  }, [loadPremiumStatus]);

  const upgradeToPro = async () => {
    try {
      // Call this only after a successful purchase result whose `pro`
      // entitlement is active. It intentionally does not contact the store.
      await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      setIsPro(true);
    } catch (error) {
      console.error('[usePremium] Error upgrading to pro:', error);
    }
  };

  return { isPro, loading, upgradeToPro, refreshPremiumStatus: checkProStatusCallback };
}
