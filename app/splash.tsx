
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shinePosition = useRef(new Animated.Value(-SCREEN_WIDTH)).current;

  useEffect(() => {
    console.log("[Splash] Splash screen mounted");

    // Start shine animation immediately
    Animated.timing(shinePosition, {
      toValue: SCREEN_WIDTH * 2,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // After 2 seconds, fade out and navigate
    const timer = setTimeout(() => {
      console.log("[Splash] Fading out splash screen");
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        console.log("[Splash] Navigating to home screen");
        router.replace("/(tabs)/(home)/");
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={["#4B0082", "#4B0082"]}
        style={styles.gradient}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require("@/assets/images/final_quest_240x240.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Text */}
        <Text style={styles.tagline}>The path to transforming your life.</Text>

        {/* Silver shine sweep */}
        <Animated.View
          style={[
            styles.shine,
            {
              transform: [{ translateX: shinePosition }],
            },
          ]}
        />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 180,
    height: 180,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF",
    textAlign: "center",
    paddingHorizontal: 40,
    opacity: 0.95,
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 100,
    height: "100%",
    backgroundColor: "rgba(192, 192, 192, 0.3)",
    transform: [{ skewX: "-20deg" }],
  },
});
