
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/styles/commonStyles";
import { IconSymbol } from "@/components/IconSymbol";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem("hasSeenWelcome", "true");
      router.replace("/(tabs)/(home)/");
    } catch (error) {
      console.error("Error saving welcome status:", error);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto-awesome"
              size={80}
              color={colors.card}
            />
          </View>

          <Text style={styles.title}>Welcome to Indigo Habits</Text>
          <Text style={styles.subtitle}>
            Your journey to mindfulness and growth starts here
          </Text>

          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="book.fill"
                android_material_icon_name="menu-book"
                size={32}
                color={colors.card}
              />
              <Text style={styles.featureText}>Daily Journal</Text>
              <Text style={styles.featureDescription}>
                Reflect on your day with a clean, beautiful journal
              </Text>
            </View>

            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="heart.fill"
                android_material_icon_name="favorite"
                size={32}
                color={colors.card}
              />
              <Text style={styles.featureText}>Daily Affirmations</Text>
              <Text style={styles.featureDescription}>
                Start each day with positive, uplifting affirmations
              </Text>
            </View>

            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={32}
                color={colors.card}
              />
              <Text style={styles.featureText}>Habit Tracking</Text>
              <Text style={styles.featureDescription}>
                Build lasting habits with simple, visual tracking
              </Text>
            </View>

            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={32}
                color={colors.card}
              />
              <Text style={styles.featureText}>Progress & Streaks</Text>
              <Text style={styles.featureDescription}>
                Watch your growth with streaks and achievements
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
            <IconSymbol
              ios_icon_name="arrow.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 48 : 60,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.card,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.card,
    textAlign: "center",
    marginBottom: 48,
    opacity: 0.9,
  },
  featuresContainer: {
    width: "100%",
    gap: 24,
    marginBottom: 48,
  },
  featureItem: {
    alignItems: "center",
  },
  featureText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.card,
    marginTop: 12,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.card,
    textAlign: "center",
    opacity: 0.8,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.2)",
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
});
