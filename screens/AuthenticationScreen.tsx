import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { settingsService } from "../services/SettingsService";
import { getTheme } from "../utils/themes";

const { width, height } = Dimensions.get("window");

export default function AuthenticationScreen() {
  const { settings, authenticate } = useApp();
  const theme = getTheme(settings.theme);
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState("Biometric");

  useEffect(() => {
    checkBiometricAndAutoAuthenticate();
  }, []);

  const checkBiometricAndAutoAuthenticate = async () => {
    try {
      const { isAvailable, biometricType: type } =
        await settingsService.isBiometricAvailable();
      setBiometricAvailable(isAvailable);
      setBiometricType(type);

      // Auto-authenticate with biometric if enabled and available
      if (settings.biometricEnabled && isAvailable) {
        handleBiometricAuth();
      }
    } catch (error) {
      console.error("Error checking biometric availability:", error);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      const success = await settingsService.authenticateWithBiometric();
      if (success) {
        await authenticate();
      } else {
        Alert.alert("Authentication Failed", "Please try again or use PIN");
      }
    } catch (error) {
      console.error("Biometric authentication error:", error);
      Alert.alert("Error", "Biometric authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinAuth = async () => {
    if (pin.length < 4) {
      Alert.alert("Invalid PIN", "Please enter a 4-digit PIN");
      return;
    }

    try {
      setIsLoading(true);
      const isValid = await settingsService.verifyPin(pin);
      if (isValid) {
        await authenticate();
      } else {
        Alert.alert("Invalid PIN", "The PIN you entered is incorrect");
        setPin("");
      }
    } catch (error) {
      console.error("PIN authentication error:", error);
      Alert.alert("Error", "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              {
                backgroundColor:
                  index < pin.length ? theme.accent : theme.border,
                borderColor: theme.border,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      ["", 0, "delete"],
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((num, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.numberButton,
                  { backgroundColor: theme.cardBackground },
                ]}
                onPress={() => {
                  if (num === "delete") {
                    setPin(pin.slice(0, -1));
                  } else if (num !== "" && pin.length < 4) {
                    setPin(pin + num.toString());
                  }
                }}
                disabled={num === "" || isLoading}
              >
                {num === "delete" ? (
                  <AntDesign name="delete" size={24} color={theme.text} />
                ) : num !== "" ? (
                  <Text style={[styles.numberText, { color: theme.text }]}>
                    {num}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: theme.accent }]}>
          <AntDesign name="wallet" size={48} color="white" />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          Expense Tracker
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {settings.pinEnabled ? "Enter your PIN" : "Authenticate to continue"}
        </Text>
      </View>

      {settings.pinEnabled && (
        <View style={styles.pinSection}>
          {renderPinDots()}
          {renderNumberPad()}
        </View>
      )}

      <View style={styles.authButtons}>
        {settings.biometricEnabled && biometricAvailable && (
          <TouchableOpacity
            style={[styles.biometricButton, { backgroundColor: theme.accent }]}
            onPress={handleBiometricAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <AntDesign name="Safety" size={24} color="white" />
                <Text style={styles.biometricButtonText}>
                  Use {biometricType}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {settings.pinEnabled && pin.length === 4 && (
          <TouchableOpacity
            style={[styles.confirmButton, { backgroundColor: theme.accent }]}
            onPress={handlePinAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm PIN</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Math.max(20, width * 0.05),
  },
  header: {
    alignItems: "center",
    marginBottom: Math.max(50, height * 0.08),
  },
  iconContainer: {
    width: Math.max(80, width * 0.2),
    height: Math.max(80, width * 0.2),
    borderRadius: Math.max(40, width * 0.1),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Math.max(20, width * 0.05),
  },
  title: {
    fontSize: Math.max(28, width * 0.07),
    fontWeight: "800",
    marginBottom: Math.max(8, width * 0.02),
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Math.max(16, width * 0.04),
    textAlign: "center",
    fontWeight: "500",
  },
  pinSection: {
    alignItems: "center",
    marginBottom: Math.max(40, height * 0.06),
  },
  pinDotsContainer: {
    flexDirection: "row",
    marginBottom: Math.max(40, height * 0.06),
    gap: Math.max(15, width * 0.04),
  },
  pinDot: {
    width: Math.max(16, width * 0.04),
    height: Math.max(16, width * 0.04),
    borderRadius: Math.max(8, width * 0.02),
    borderWidth: 2,
  },
  numberPad: {
    alignItems: "center",
  },
  numberRow: {
    flexDirection: "row",
    marginBottom: Math.max(15, width * 0.04),
    gap: Math.max(20, width * 0.05),
  },
  numberButton: {
    width: Math.max(70, width * 0.18),
    height: Math.max(70, width * 0.18),
    borderRadius: Math.max(35, width * 0.09),
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  numberText: {
    fontSize: Math.max(24, width * 0.06),
    fontWeight: "600",
  },
  authButtons: {
    width: "100%",
    alignItems: "center",
    gap: Math.max(15, width * 0.04),
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Math.max(15, width * 0.04),
    paddingHorizontal: Math.max(30, width * 0.08),
    borderRadius: Math.max(25, width * 0.06),
    minWidth: Math.max(200, width * 0.5),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  biometricButtonText: {
    color: "white",
    fontSize: Math.max(16, width * 0.04),
    fontWeight: "700",
    marginLeft: Math.max(10, width * 0.025),
  },
  confirmButton: {
    paddingVertical: Math.max(15, width * 0.04),
    paddingHorizontal: Math.max(30, width * 0.08),
    borderRadius: Math.max(25, width * 0.06),
    minWidth: Math.max(200, width * 0.5),
    alignItems: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  confirmButtonText: {
    color: "white",
    fontSize: Math.max(16, width * 0.04),
    fontWeight: "700",
  },
});
