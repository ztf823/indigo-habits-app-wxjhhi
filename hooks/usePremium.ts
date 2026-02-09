
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getCustomerInfo, checkProStatus } from '@/utils/revenueCat';

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
      
      // On native platforms, check RevenueCat
      try {
        const revenueCatStatus = await checkProStatus();
        console.log('[usePremium] RevenueCat premium status:', revenueCatStatus);
        
        // Update local storage to match RevenueCat
        await AsyncStorage.setItem(PREMIUM_KEY, revenueCatStatus.toString());
        setIsPro(revenueCatStatus);
      } catch (error) {
        console.error('[usePremium] Error checking RevenueCat status:', error);
        
        // Fallback to local storage if RevenueCat fails
        const stored = await AsyncStorage.getItem(PREMIUM_KEY);
        const isProStored = stored === 'true';
        setIsPro(isProStored);
        console.log('[usePremium] Using fallback storage value:', isProStored);
      }
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
      console.log('[usePremium] Upgrading to pro...');
      
      // This will be called after successful purchase
      await AsyncStorage.setItem(PREMIUM_KEY, 'true');
      setIsPro(true);
      
      console.log('[usePremium] Pro status updated');
    } catch (error) {
      console.error('[usePremium] Error upgrading to pro:', error);
    }
  };

  return { isPro, loading, upgradeToPro, checkProStatus: checkProStatusCallback };
}
