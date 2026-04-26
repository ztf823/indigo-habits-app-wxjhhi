// Shim to replace expo-glass-effect (which requires the New Architecture and
// crashed iOS production builds). Provides a drop-in <GlassView> that renders
// a regular <View> with a translucent backdrop. Visually close enough on iOS
// versions that don't support Liquid Glass anyway.
import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

interface GlassViewProps extends ViewProps {
  glassEffectStyle?: 'clear' | 'regular' | 'identity';
  isInteractive?: boolean;
  tintColor?: string;
}

export function GlassView({
  glassEffectStyle = 'regular',
  isInteractive,
  tintColor,
  style,
  children,
  ...rest
}: GlassViewProps) {
  const fallback =
    glassEffectStyle === 'clear'
      ? styles.clear
      : glassEffectStyle === 'identity'
      ? styles.identity
      : styles.regular;

  return (
    <View style={[fallback, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clear: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  regular: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  identity: {
    backgroundColor: 'transparent',
  },
});

export default GlassView;
