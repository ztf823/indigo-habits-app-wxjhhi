
import { Redirect } from "expo-router";
import React from "react";

export default function Index() {
  console.log("Index screen: Redirecting directly to home screen");
  
  // Go directly to home screen - no splash screen
  return <Redirect href="/(tabs)/(home)/" />;
}
