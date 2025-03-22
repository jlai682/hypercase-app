import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import config from "../config";

const login = () => {
  const { loginType = "patient" } = useLocalSearchParams(); // Default to "patient" if not provided
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Please fill in both email and password");
      return;
    }

    try {
      const endpoint =
        loginType === "provider"
          ? `${config.BACKEND_URL}/api/providerManagement/login/`
          : `${config.BACKEND_URL}/api/patientManagement/login/`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (loginType === "provider") {
          router.push("/providerDash")
        }
        else{
          router.push("/home");
        }
      } else {
        // Login failed, show error message
        Alert.alert("Login Failed", data.error || "Please try again");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {loginType === "provider" ? "Provider Login" : "Patient Login"}
        </Text>

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>

      {/* Register Section */}
      <View style={styles.registerContainer}>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/signup", params: { signupType: loginType } })
          }
        >
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Register Now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#cae7ff",
    width: "100%",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  registerContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
    paddingBottom: 30,
  },
  title: {
    fontSize: 35,
    fontFamily: "Figtree_400Regular",
    marginBottom: 20,
    color: "#041575",
  },
  input: {
    width: "80%",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  inputText: {
    fontSize: 14,
  },
  button: {
    width: 300,
    height: 50,
    backgroundColor: "#041575",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Figtree_400Regular",
  },
  registerText: {
    fontSize: 14,
    color: "#333",
  },
  registerLink: {
    color: "#0077CC",
    fontWeight: "bold",
  },
});

export default login;
