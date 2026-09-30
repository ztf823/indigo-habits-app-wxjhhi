
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { checkProStatus, addCustomerInfoUpdateListener } from '@/utils/revenueCat';

export function usePremium() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadPremiumStatus = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[usePremium] Loading premium status...');
      
      // Web has no verified store entitlement in this app.
      if (Platform.OS === 'web') {
        setIsPro(false);
        console.log('[usePremium] Web platform has no verified store entitlement');
        return;
      }
      
      // Native entitlement access is determined only by RevenueCat. A saved local
      // flag must never unlock Premium when the store entitlement cannot be verified.
      const revenueCatStatus = await checkProStatus();
      const verifiedPremium = revenueCatStatus === true;
      setIsPro(verifiedPremium);
      console.log('[usePremium] RevenueCat premium status:', revenueCatStatus);
    } catch (error) {
      console.error('[usePremium] Error loading premium status:', error);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let removeListener: (() => void) | undefined;
    void loadPremiumStatus();
    if (Platform.OS !== 'web') {
      void addCustomerInfoUpdateListener((verifiedPremium) => {
        if (!mounted) return;
        setIsPro(verifiedPremium);
      }).then((remove) => {
        if (mounted) removeListener = remove;
        else remove();
      });
    }
    return () => {
      mounted = false;
      removeListener?.();
    };
  }, [loadPremiumStatus]);

  const checkProStatusCallback = useCallback(async () => {
    await loadPremiumStatus();
  }, [loadPremiumStatus]);

  const upgradeToPro = async () => {
    try {
      // Kept for API compatibility; only a verified store entitlement can unlock.
      await loadPremiumStatus();
    } catch (error) {
      console.error('[usePremium] Error upgrading to pro:', error);
    }
  };

  return { isPro, loading, upgradeToPro, refreshPremiumStatus: checkProStatusCallback };
}
