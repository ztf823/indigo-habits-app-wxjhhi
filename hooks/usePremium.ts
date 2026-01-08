
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRO_STATUS_KEY = '@pro_status';

export function usePremium() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkProStatus = useCallback(async () => {
    try {
      const status = await AsyncStorage.getItem(PRO_STATUS_KEY);
      setIsPro(status === 'true');
    } catch (error) {
      console.error('Error checking pro status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const showPaywall = useCallback(async () => {
    // Placeholder for paywall logic
    console.log('Show paywall');
  }, []);

  useEffect(() => {
    checkProStatus();
  }, [checkProStatus]);

  return { isPro, loading, checkProStatus, showPaywall };
}
