
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePremium() {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    try {
      const proStatus = await AsyncStorage.getItem('isPro');
      setIsPro(proStatus === 'true');
    } catch (error) {
      console.error('Error checking pro status:', error);
    } finally {
      setLoading(false);
    }
  };

  const upgradeToPro = async () => {
    try {
      await AsyncStorage.setItem('isPro', 'true');
      setIsPro(true);
    } catch (error) {
      console.error('Error upgrading to pro:', error);
    }
  };

  return { isPro, loading, upgradeToPro, checkProStatus };
}
