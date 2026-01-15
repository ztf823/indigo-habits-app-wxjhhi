
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shinePosition = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("[Splash] Splash screen mounted");

    // Mark splash as seen
    AsyncStorage.setItem("hasSeenSplash", "true").catch(console.error);

    // Animate logo scale up
    Animated.spring(logoScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Fade in text after logo
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // Start shine animation
    Animated.timing(shinePosition, {
      toValue: SCREEN_WIDTH * 2,
      duration: 2000,
      delay: 500,
      useNativeDriver: true,
    }).start();

    // After 2.5 seconds, fade out and navigate
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
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={["#4B0082", "#6A0DAD"]}
        style={styles.gradient}
      >
        {/* Logo with animation */}
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("@/assets/images/f61de770-7b2e-4a90-b8f2-478836e42e2a.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text 
          style={[
            styles.tagline,
            { opacity: textOpacity },
          ]}
        >
          The path to transforming your life.
        </Animated.Text>

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
    width: 280,
    height: 280,
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
