
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function usePremium() {
  // 🚀 PREVIEW MODE: Pro features unlocked for testing
  // Set isPro to true to preview all premium features without payment
  const [isPro, setIsPro] = useState(true); // Changed from false to true for preview mode
  const [loading, setLoading] = useState(false); // Changed from true to false since we're not loading

  useEffect(() => {
    // Preview mode: Skip loading from storage, always use true
    console.log('🚀 PREVIEW MODE: Pro features unlocked for testing');
  }, []);

  const checkProStatus = async () => {
    // Preview mode: Always return true
    console.log('🚀 PREVIEW MODE: Pro status check - always true');
  };

  const upgradeToPro = async () => {
    // Preview mode: Already pro, no action needed
    console.log('🚀 PREVIEW MODE: Already in pro mode');
  };

  return { isPro, loading, upgradeToPro, checkProStatus };
}
