import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";

// Add this component to check role before allowing access to MainTabs
function RoleProtectedScreen({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    checkRole();
  }, []);

  const checkRole = async () => {
    try {
      const userRole = await SecureStore.getItemAsync("userRole");
      const token = await SecureStore.getItemAsync("token");

      // Check if user is logged in and has siteincharge role
      if (!token) {
        // No token, redirect to login
        navigation.replace("Login");
        return;
      }

      if (userRole === "siteincharge") {
        setAuthorized(true);
      } else {
        // Not a site incharge, clear session and redirect
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("encodedUserId");
        await SecureStore.deleteItemAsync("loginTime");
        await SecureStore.deleteItemAsync("userName");
        await SecureStore.deleteItemAsync("userEmail");
        await SecureStore.deleteItemAsync("userRole");
        await SecureStore.deleteItemAsync("userId");
        
        navigation.replace("Login");
      }
    } catch (error) {
      console.error("Role check error:", error);
      navigation.replace("Login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-50">
        <ActivityIndicator size="large" color="#1e7a6f" />
        <Text className="mt-4 text-gray-600">Verifying access...</Text>
      </View>
    );
  }

  if (!authorized) {
    return (
      <View className="items-center justify-center flex-1 bg-gray-50">
        <Text className="text-lg text-gray-800">Access Denied</Text>
        <Text className="mt-2 text-gray-600">Redirecting to login...</Text>
      </View>
    );
  }

  return children;
}

export default RoleProtectedScreen;