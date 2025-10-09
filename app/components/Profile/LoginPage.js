import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter both email and password",
      });
      return;
    }

    setLoading(true);

    try {
      // --- LOGIN REQUEST ---
      const response = await axios.post(
        "http://ip/auth/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      const { token, encodedUserId } = response.data;

      // --- SAVE TOKEN LOCALLY ---
      await SecureStore.setItemAsync("token", token);
      await SecureStore.setItemAsync("encodedUserId", encodedUserId);
      await SecureStore.setItemAsync("loginTime", Date.now().toString());

      // --- VERIFY TOKEN ---
      const verifyResponse = await axios.post(
        "http://ip/auth/verify-token",
        { token },
        { headers: { "Content-Type": "application/json" } }
      );

      const userData = verifyResponse.data;
      console.log("Verified user:", userData);

      // ✅ Allow only siteincharge
      if (userData.role !== "siteincharge") {
        Toast.show({
          type: "error",
          text1: "Access Denied",
          text2:
            "This mobile app is only for Site Incharge users. Please use the web application.",
        });

        // Clear saved credentials
        await SecureStore.deleteItemAsync("token");
        await SecureStore.deleteItemAsync("encodedUserId");
        await SecureStore.deleteItemAsync("loginTime");
        return;
      }

      // --- SAVE USER DETAILS ---
      await SecureStore.setItemAsync("userName", userData.user_name);
      await SecureStore.setItemAsync("userEmail", userData.user_email);
      await SecureStore.setItemAsync("userRole", userData.role);
      await SecureStore.setItemAsync("userId", String(userData.user_id));

      Toast.show({
        type: "success",
        text1: "Login successful!",
      });

      // --- NAVIGATE TO MAIN APP ---
      setTimeout(() => {
        navigation.replace("MainTabs", { encodedUserId });
      }, 1500);
    } catch (error) {
      console.error("Login error:", error?.response?.data || error.message);
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2:
          error.response?.data?.error ||
          error.response?.statusText ||
          "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="items-center justify-center flex-1 px-5 bg-gray-50">
      {/* Logo */}
      <View className="mb-5">
        <Image
          source={require("../../assets/logo.png")}
          className="w-28 h-28"
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <Text className="mb-2 text-2xl font-semibold text-center text-gray-900">
        Welcome to Sathya Coatings
      </Text>

      <Text className="mb-6 text-sm text-center text-gray-600">
        Site Incharge Mobile App
      </Text>

      {/* Email Input */}
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className="w-full px-4 py-3 mb-4 bg-white border border-gray-300 rounded-lg"
      />

      {/* Password Input */}
      <TextInput
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="w-full px-4 py-3 mb-4 bg-white border border-gray-300 rounded-lg"
      />

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        className={`w-full py-3 rounded-lg ${
          loading ? "bg-gray-400" : "bg-[#1e7a6f]"
        }`}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-lg font-semibold text-center text-white">
            Log In
          </Text>
        )}
      </TouchableOpacity>

      <Toast />
    </View>
  );
};

export default LoginPage;
