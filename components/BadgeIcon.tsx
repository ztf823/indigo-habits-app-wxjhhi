
import React from "react";
import { View, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/IconSymbol";

interface BadgeIconProps {
  badgeName: string;
  earned: boolean;
  size?: number;
  glowColor?: string;
}

// Map badge names to their unique icons
const BADGE_ICON_MAP: Record<string, { ios: string; android: string }> = {
  "Indigo Warrior": { ios: "sword", android: "sports-martial-arts" }, // sword icon
  "Indigo Guardian": { ios: "shield.fill", android: "shield" }, // shield icon
  "Indigo Sentinel": { ios: "eye.fill", android: "visibility" }, // eye icon
  "Indigo Champion": { ios: "trophy.fill", android: "emoji-events" }, // trophy icon
  "Indigo Legend": { ios: "crown.fill", android: "workspace-premium" }, // crown icon 👑
  "Indigo Sovereign": { ios: "crown.fill", android: "workspace-premium" }, // crown icon
  "Indigo Eternal": { ios: "infinity", android: "all-inclusive" }, // infinity icon
  "Indigo Vanguard": { ios: "sword", android: "sports-martial-arts" }, // sword icon 🗡️
  "Indigo Titan": { ios: "mountain.2.fill", android: "terrain" }, // mountain icon
  "Indigo Immortal": { ios: "flame.fill", android: "local-fire-department" }, // phoenix icon (using flame as closest)
  "Indigo Apex": { ios: "triangle.fill", android: "change-history" }, // peak icon (triangle)
  "Indigo Master": { ios: "star.fill", android: "star" }, // star icon
};

export function BadgeIcon({ badgeName, earned, size = 40, glowColor }: BadgeIconProps) {
  const iconConfig = BADGE_ICON_MAP[badgeName] || { ios: "star.fill", android: "star" };
  
  // Color logic: gold when earned, silver/indigo when locked
  const iconColor = earned ? "#FFD700" : "#9CA3AF"; // Gold or Silver
  
  return (
    <View
      style={[
        styles.container,
        {
          width: size * 1.6,
          height: size * 1.6,
          borderRadius: size * 0.8,
        },
        earned && glowColor && {
          backgroundColor: glowColor + "20",
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
          elevation: 8,
        },
        !earned && {
          backgroundColor: "#4F46E520", // Indigo tint for locked
        },
      ]}
    >
      <IconSymbol
        ios_icon_name={iconConfig.ios}
        android_material_icon_name={iconConfig.android}
        size={size}
        color={iconColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
