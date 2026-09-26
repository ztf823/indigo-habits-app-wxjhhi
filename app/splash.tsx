import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, Dimensions, Image } from "react-native";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shinePosition = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(logoScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }).start();
    Animated.timing(textOpacity, { toValue: 1, duration: 800, delay: 300, useNativeDriver: true }).start();
    Animated.timing(shinePosition, { toValue: SCREEN_WIDTH * 2, duration: 2000, delay: 500, useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        router.replace("/(tabs)/(home)/");
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [router, fadeAnim, logoScale, textOpacity, shinePosition]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }] }]}>
        <Image source={require("@/assets/images/blue-flame-icon.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
        The path to transforming your life.
      </Animated.Text>
      <Animated.View style={[styles.shine, { transform: [{ translateX: shinePosition }] }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080D2B", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" },
  logoContainer: { marginBottom: 40 },
  logo: { width: SCREEN_HEIGHT * 0.4, height: SCREEN_HEIGHT * 0.4 },
  tagline: { fontSize: 20, fontWeight: "bold", color: "#EAF7FF", textAlign: "center", paddingHorizontal: 40, letterSpacing: 0.5 },
  shine: { position: "absolute", top: 0, left: 0, width: 80, height: "100%", backgroundColor: "rgba(54, 215, 255, 0.16)", transform: [{ skewX: "-20deg" }] },
});
