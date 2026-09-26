import { Redirect } from "expo-router";
import React from "react";

// Kept only to safely handle old deep links. The app has one native launch splash.
export default function LegacySplashRoute() {
  return <Redirect href="/(tabs)/(home)/" />;
}
