import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useApp } from "../context/AppContext";
import {
  CURRENCIES,
  CATEGORIES,
  settingsService,
} from "../services/SettingsService";
import { databaseService } from "../services/DatabaseService";
import { getTheme } from "../utils/themes";
import { SettingsScreenNavigationProp } from "../types/navigation";

const { width } = Dimensions.get("window");

export default function SettingsScreen({
  navigation,
}: {
  navigation: SettingsScreenNavigationProp;
}) {
  const { settings, updateSettings, expenses } = useApp();
  const theme = getTheme(settings.theme);
  const [isExporting, setIsExporting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState({
    isAvailable: false,
    biometricType: "Biometric",
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const info = await settingsService.isBiometricAvailable();
    setBiometricInfo(info);
  };

  const handleCurrencyChange = async (currency: string) => {
    try {
      await updateSettings({ currency });
      Alert.alert("Success", "Currency updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update currency");
    }
  };

  const showCurrencyPicker = () => {
    navigation.navigate("CurrencySelection");
  };

  const handleDefaultCategoryChange = async (category: string) => {
    try {
      await updateSettings({ defaultCategory: category });
      Alert.alert("Success", "Default category updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update default category");
    }
  };

  const showCategoryPicker = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = async (category: string) => {
    setShowCategoryModal(false);
    setShowCustomInput(false);
    setCustomCategory("");
    await handleDefaultCategoryChange(category);
  };

  const handleCustomCategorySubmit = async () => {
    if (customCategory.trim()) {
      await handleCategorySelect(customCategory.trim());
    }
  };

  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCategoryModal(false)}
    >
      <View
        style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.cardBackground },
          ]}
        >
          <View
            style={[styles.modalHeader, { borderBottomColor: theme.border }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Select Category
            </Text>
            <TouchableOpacity
              onPress={() => setShowCategoryModal(false)}
              style={styles.closeButton}
            >
              <AntDesign name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {!showCustomInput ? (
            <>
              <FlatList
                data={CATEGORIES}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryItem,
                      { backgroundColor: theme.inputBackground },
                      settings.defaultCategory === item && [
                        styles.selectedCategoryItem,
                        {
                          backgroundColor: theme.accent + "20",
                          borderColor: theme.accent,
                        },
                      ],
                    ]}
                    onPress={() => handleCategorySelect(item)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: theme.text },
                        settings.defaultCategory === item && [
                          styles.selectedCategoryText,
                          { color: theme.accent },
                        ],
                      ]}
                    >
                      {item}
                    </Text>
                    {settings.defaultCategory === item && (
                      <AntDesign name="check" size={20} color={theme.accent} />
                    )}
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity
                style={[
                  styles.customCategoryButton,
                  { borderColor: theme.accent },
                ]}
                onPress={() => setShowCustomInput(true)}
              >
                <AntDesign name="plus" size={20} color={theme.accent} />
                <Text
                  style={[styles.customCategoryText, { color: theme.accent }]}
                >
                  Add Custom Category
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContainer}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.customInputContainer}>
                  <Text
                    style={[styles.customInputLabel, { color: theme.text }]}
                  >
                    Enter Custom Category:
                  </Text>
                  <TextInput
                    style={[
                      styles.customTextInput,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.inputBorder,
                        color: theme.text,
                      },
                    ]}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    placeholder="e.g., Pet Care, Hobbies"
                    placeholderTextColor={theme.textSecondary}
                    autoFocus={true}
                    maxLength={30}
                  />
                  <View style={styles.customInputButtons}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        { borderColor: theme.border },
                      ]}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomCategory("");
                      }}
                    >
                      <Text
                        style={[
                          styles.cancelButtonText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: theme.accent },
                        !customCategory.trim() && styles.addButtonDisabled,
                      ]}
                      onPress={handleCustomCategorySubmit}
                      disabled={!customCategory.trim()}
                    >
                      <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </View>
      </View>
    </Modal>
  );

  const toggleTheme = async () => {
    const newTheme = settings.theme === "light" ? "dark" : "light";
    try {
      console.log("=== THEME TOGGLE DEBUG ===");
      console.log("1. Current theme:", settings.theme);
      console.log("2. Toggling to theme:", newTheme);

      await updateSettings({ theme: newTheme });

      console.log("3. Theme toggle completed");
      console.log("==========================");

      // Optional: Show a brief success message
      // Alert.alert(
      //   "Theme Changed",
      //   `Switched to ${newTheme} theme`
      // );
    } catch (error) {
      console.error("Error toggling theme:", error);
      Alert.alert("Error", "Failed to change theme. Please try again.");
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      if (enabled && !biometricInfo.isAvailable) {
        Alert.alert(
          "Biometric Not Available",
          "Biometric authentication is not available or not set up on this device. Please set up fingerprint or face recognition in your device settings first."
        );
        return;
      }

      await settingsService.setBiometricEnabled(enabled);
      await updateSettings({ biometricEnabled: enabled });
      Alert.alert(
        "Success",
        `${biometricInfo.biometricType} authentication ${
          enabled ? "enabled" : "disabled"
        }!`
      );
    } catch (error) {
      console.error("Biometric toggle error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to update biometric settings"
      );
    }
  };

  const handlePinToggle = async (enabled: boolean) => {
    if (enabled) {
      // Show PIN input dialog
      Alert.prompt(
        "Set PIN",
        "Enter a 4-digit PIN to secure your app:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Set PIN",
            onPress: async (pin) => {
              if (!pin || pin.length < 4 || !/^\d+$/.test(pin)) {
                Alert.alert(
                  "Invalid PIN",
                  "Please enter a 4-digit numeric PIN"
                );
                return;
              }

              try {
                await settingsService.setPin(pin);
                await updateSettings({ pinEnabled: true });
                Alert.alert("Success", "PIN protection enabled!");
              } catch (error) {
                Alert.alert("Error", "Failed to set PIN");
              }
            },
          },
        ],
        "secure-text",
        "",
        "numeric"
      );
    } else {
      Alert.alert(
        "Disable PIN",
        "Are you sure you want to disable PIN protection?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Disable",
            style: "destructive",
            onPress: async () => {
              try {
                await settingsService.setPinEnabled(false);
                await updateSettings({ pinEnabled: false });
                Alert.alert("Success", "PIN protection disabled!");
              } catch (error) {
                Alert.alert("Error", "Failed to disable PIN");
              }
            },
          },
        ]
      );
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);

      if (expenses.length === 0) {
        Alert.alert("No Data", "No expenses to export");
        return;
      }

      // Create CSV content
      const csvHeader = "Title,Amount,Category,Date,Description\n";
      const csvRows = expenses
        .map(
          (expense) =>
            `"${expense.title}",${expense.amount},"${expense.category}","${
              expense.date
            }","${expense.description || ""}"`
        )
        .join("\n");

      const csvContent = csvHeader + csvRows;

      // Share the data
      await Share.share({
        message: csvContent,
        title: "Expense Data Export",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackupSettings = async () => {
    try {
      const settingsJson = await settingsService.exportSettings();
      await Share.share({
        message: settingsJson,
        title: "Settings Backup",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to backup settings");
    }
  };

  const handleRestoreSettings = () => {
    Alert.prompt(
      "Restore Settings",
      "Paste your settings backup data:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          onPress: async (settingsData) => {
            if (!settingsData) return;

            try {
              await settingsService.importSettings(settingsData);
              const newSettings = await settingsService.getSettings();
              await updateSettings(newSettings);
              Alert.alert("Success", "Settings restored successfully!");
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to restore settings. Please check the format."
              );
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out EXPEN$IO - A smart expense tracker that helps you manage your finances better!",
        title: "EXPEN$IO - Smart Expense Tracker",
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleBudgetToggle = async (enabled: boolean) => {
    try {
      await settingsService.setBudgetEnabled(enabled);
      await updateSettings({ budgetEnabled: enabled });

      if (enabled && settings.monthlyBudget === 0) {
        // Show budget setup if enabling for first time
        setShowBudgetModal(true);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update budget settings");
    }
  };

  const handleBudgetAmountPress = () => {
    setBudgetInput(settings.monthlyBudget.toString());
    setShowBudgetModal(true);
  };

  const handleBudgetSubmit = async () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid budget amount");
      return;
    }

    try {
      await settingsService.setMonthlyBudget(amount);
      await updateSettings({ monthlyBudget: amount });
      setShowBudgetModal(false);
      setBudgetInput("");
      Alert.alert("Success", "Monthly budget updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update budget");
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your expenses. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: confirmClearData,
        },
      ]
    );
  };

  const confirmClearData = async () => {
    try {
      await databaseService.clearAllData();
      Alert.alert("Success", "All data has been cleared");
    } catch (error) {
      Alert.alert("Error", "Failed to clear data");
    }
  };

  const SettingRow = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
    showChevron = true,
    isLast = false,
  }: {
    icon: keyof typeof AntDesign.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
    isLast?: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.settingRow,
        { borderBottomColor: theme.border },
        isLast && { borderBottomWidth: 0 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: theme.accent + "20" },
          ]}
        >
          <AntDesign name={icon} size={20} color={theme.accent} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: theme.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.settingSubtitle, { color: theme.textSecondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showChevron && onPress && (
          <AntDesign
            name="right"
            size={16}
            color={theme.textSecondary}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={[styles.headerSection, { backgroundColor: theme.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerTitleContainer}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Manage your preferences
              </Text>
            </View>
            <View style={[styles.headerIconContainer, { backgroundColor: theme.accent + '15' }]}>
              <AntDesign name="setting" size={24} color={theme.accent} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Quick Actions Grid */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={showCurrencyPicker}
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: "#4CAF50" + "20" },
              ]}
            >
              <AntDesign name="wallet" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>
              Currency
            </Text>
            <Text
              style={[styles.quickActionValue, { color: theme.textSecondary }]}
            >
              {CURRENCIES.find((c) => c.code === settings.currency)?.symbol}{" "}
              {settings.currency}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={toggleTheme}
          >
            <View
              style={[
                styles.quickActionIcon,
                { backgroundColor: "#FF9800" + "20" },
              ]}
            >
              <AntDesign name="bulb1" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.quickActionTitle, { color: theme.text }]}>
              Theme
            </Text>
            <Text
              style={[styles.quickActionValue, { color: theme.textSecondary }]}
            >
              {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AntDesign name="star" size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Preferences
            </Text>
          </View>

          <View
            style={[
              styles.settingsGroup,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <SettingRow
              icon="tags"
              title="Default Category"
              subtitle={settings.defaultCategory}
              onPress={showCategoryPicker}
              rightComponent={
                <AntDesign name="right" size={16} color={theme.textSecondary} />
              }
              showChevron={false}
              isLast={true}
            />
          </View>
        </View>

        {/* Budget & Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AntDesign name="wallet" size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Budget & Notifications
            </Text>
          </View>

          <View
            style={[
              styles.settingsGroup,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <SettingRow
              icon="piechart"
              title="Monthly Budget"
              subtitle={
                settings.budgetEnabled
                  ? `${settingsService.formatAmount(
                      settings.monthlyBudget,
                      settings.currency
                    )} per month`
                  : "Disabled"
              }
              rightComponent={
                <Switch
                  value={settings.budgetEnabled}
                  onValueChange={handleBudgetToggle}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={settings.budgetEnabled ? "#fff" : "#f4f3f4"}
                />
              }
              showChevron={false}
            />

            {settings.budgetEnabled && (
              <SettingRow
                icon="edit"
                title="Budget Amount"
                subtitle={`Set your monthly spending limit`}
                onPress={handleBudgetAmountPress}
                rightComponent={
                  <Text
                    style={[
                      {
                        color: theme.accent,
                        fontWeight: "600",
                        fontSize: Math.max(14, width * 0.035),
                      },
                    ]}
                  >
                    {settingsService.formatAmount(
                      settings.monthlyBudget,
                      settings.currency
                    )}
                  </Text>
                }
                showChevron={true}
                isLast={true}
              />
            )}
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AntDesign name="Safety" size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Security & Privacy
            </Text>
          </View>

          <View
            style={[
              styles.settingsGroup,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <SettingRow
              icon="Safety"
              title={`${biometricInfo.biometricType} Authentication`}
              subtitle={
                biometricInfo.isAvailable
                  ? `Secure with ${biometricInfo.biometricType.toLowerCase()}`
                  : `${biometricInfo.biometricType} not available on this device`
              }
              rightComponent={
                <Switch
                  value={settings.biometricEnabled && biometricInfo.isAvailable}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={settings.biometricEnabled ? "#fff" : "#f4f3f4"}
                  disabled={!biometricInfo.isAvailable}
                />
              }
              showChevron={false}
            />

            <SettingRow
              icon="lock"
              title="PIN Protection"
              subtitle="Require PIN to access app"
              rightComponent={
                <Switch
                  value={settings.pinEnabled}
                  onValueChange={handlePinToggle}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor={settings.pinEnabled ? "#fff" : "#f4f3f4"}
                />
              }
              showChevron={false}
              isLast={true}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AntDesign name="database" size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Data Management
            </Text>
          </View>

          <View
            style={[
              styles.settingsGroup,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <SettingRow
              icon="download"
              title="Export Data"
              subtitle="Download expenses as CSV file"
              onPress={handleExportData}
              rightComponent={
                isExporting ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <AntDesign
                    name="right"
                    size={16}
                    color={theme.textSecondary}
                  />
                )
              }
              showChevron={false}
            />

            <SettingRow
              icon="upload"
              title="Backup Settings"
              subtitle="Export app settings"
              onPress={handleBackupSettings}
              rightComponent={
                <AntDesign name="right" size={16} color={theme.textSecondary} />
              }
              showChevron={false}
            />

            <SettingRow
              icon="clouduploado"
              title="Restore Settings"
              subtitle="Import app settings from backup"
              onPress={handleRestoreSettings}
              rightComponent={
                <AntDesign name="right" size={16} color={theme.textSecondary} />
              }
              showChevron={false}
            />

            <SettingRow
              icon="delete"
              title="Clear All Data"
              subtitle="Permanently delete all expenses"
              onPress={handleClearAllData}
              rightComponent={
                <AntDesign name="right" size={16} color="#FF3B30" />
              }
              showChevron={false}
              isLast={true}
            />
          </View>
        </View>

        {/* About & Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AntDesign name="info" size={20} color={theme.accent} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              About & Support
            </Text>
          </View>

          {/* App Info Card */}
          <View
            style={[
              styles.aboutCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.aboutContent}>
              <View
                style={[
                  styles.appIconContainer,
                  { backgroundColor: theme.accent },
                ]}
              >
                <Text style={styles.appIconText}>E$</Text>
              </View>
              <View style={styles.aboutTextContainer}>
                <Text style={[styles.appName, { color: theme.text }]}>
                  EXPEN$IO
                </Text>
                <Text
                  style={[styles.appVersion, { color: theme.textSecondary }]}
                >
                  Version 1.0.0
                </Text>
                <Text
                  style={[styles.appDeveloper, { color: theme.textSecondary }]}
                >
                  Developed by Alfey Sani
                </Text>
              </View>
            </View>
            
            {/* App Stats */}
            <View
              style={[styles.statsContainer, { borderTopColor: theme.border }]}
            >
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.accent }]}>
                    {expenses.length}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Total Expenses
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: theme.accent }]}>
                    {expenses.length > 0 ? 
                      Math.round(expenses.reduce((sum, exp) => sum + exp.amount, 0)) : 0}
                  </Text>
                  <Text
                    style={[styles.statLabel, { color: theme.textSecondary }]}
                  >
                    Total Amount
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Support Actions */}
          <View style={styles.supportActions}>
            <View style={styles.supportRow}>
              <TouchableOpacity
                style={[
                  styles.supportCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  Alert.alert(
                    "Rate EXPEN$IO",
                    "Thank you for using EXPEN$IO! Your feedback helps us improve.",
                    [
                      { text: "Maybe Later", style: "cancel" },
                      { text: "Rate Now", onPress: () => console.log("Rate app") },
                    ]
                  );
                }}
              >
                <View style={[styles.supportIcon, { backgroundColor: '#FFD700' + '20' }]}>
                  <AntDesign name="star" size={20} color="#FFD700" />
                </View>
                <Text style={[styles.supportTitle, { color: theme.text }]}>
                  Rate App
                </Text>
                <Text style={[styles.supportSubtitle, { color: theme.textSecondary }]}>
                  Love it? Rate us!
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.supportCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border,
                  },
                ]}
                onPress={handleShare}
              >
                <View style={[styles.supportIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                  <AntDesign name="sharealt" size={20} color="#4CAF50" />
                </View>
                <Text style={[styles.supportTitle, { color: theme.text }]}>
                  Share App
                </Text>
                <Text style={[styles.supportSubtitle, { color: theme.textSecondary }]}>
                  Tell your friends
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.feedbackCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.border,
                },
              ]}
              onPress={() => {
                Alert.alert(
                  "Send Feedback",
                  "We'd love to hear from you! Send us your thoughts, suggestions, or report issues.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Send Email", onPress: () => console.log("Open email") },
                  ]
                );
              }}
            >
              <View style={styles.feedbackContent}>
                <View style={[styles.feedbackIcon, { backgroundColor: '#2196F3' + '20' }]}>
                  <AntDesign name="mail" size={20} color="#2196F3" />
                </View>
                <View style={styles.feedbackText}>
                  <Text style={[styles.feedbackTitle, { color: theme.text }]}>
                    Send Feedback
                  </Text>
                  <Text style={[styles.feedbackSubtitle, { color: theme.textSecondary }]}>
                    Help us improve by sharing your thoughts
                  </Text>
                </View>
                <AntDesign name="right" size={16} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={[styles.appInfoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Build Version
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                1.0.0 (2025)
              </Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Platform
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                React Native
              </Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>
                Last Updated
              </Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>
                September 2025
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Category Selection Modal */}
      {renderCategoryModal()}

      {/* Budget Setup Modal */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <View
              style={[styles.modalHeader, { borderBottomColor: theme.border }]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Set Monthly Budget
              </Text>
              <TouchableOpacity
                onPress={() => setShowBudgetModal(false)}
                style={styles.closeButton}
              >
                <AntDesign name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.customInputContainer}>
              <Text style={[styles.customInputLabel, { color: theme.text }]}>
                Enter your monthly budget:
              </Text>
              <TextInput
                style={[
                  styles.customTextInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.text,
                  },
                ]}
                value={budgetInput}
                onChangeText={setBudgetInput}
                placeholder="e.g., 1000"
                placeholderTextColor={theme.textSecondary}
                autoFocus={true}
                keyboardType="numeric"
              />
              <View style={styles.customInputButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={() => {
                    setShowBudgetModal(false);
                    setBudgetInput("");
                  }}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: theme.accent },
                    !budgetInput.trim() && styles.addButtonDisabled,
                  ]}
                  onPress={handleBudgetSubmit}
                  disabled={!budgetInput.trim()}
                >
                  <Text style={styles.addButtonText}>Set Budget</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingTop: Constants.statusBarHeight + Math.max(20, width * 0.05),
    paddingBottom: Math.max(24, width * 0.06),
    paddingHorizontal: Math.max(20, width * 0.05),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerContent: {
    alignItems: "flex-start",
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerIconContainer: {
    width: Math.max(48, width * 0.12),
    height: Math.max(48, width * 0.12),
    borderRadius: Math.max(24, width * 0.06),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Math.max(28, width * 0.07),
    fontWeight: "800",
    marginBottom: Math.max(4, width * 0.01),
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: "500",
  },
  content: {
    padding: Math.max(20, width * 0.05),
    marginTop: Math.max(-16, -width * 0.04),
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: Math.max(12, width * 0.03),
    marginBottom: Math.max(28, width * 0.07),
  },
  quickActionCard: {
    flex: 1,
    padding: Math.max(16, width * 0.04),
    borderRadius: Math.max(16, width * 0.04),
    alignItems: "center",
    borderWidth: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: Math.max(100, width * 0.25), // Consistent height
  },
  quickActionIcon: {
    width: Math.max(48, width * 0.12),
    height: Math.max(48, width * 0.12),
    borderRadius: Math.max(24, width * 0.06),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Math.max(10, width * 0.025),
  },
  quickActionTitle: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: "700",
    marginBottom: Math.max(3, width * 0.008),
    textAlign: "center",
  },
  quickActionValue: {
    fontSize: Math.max(12, width * 0.03),
    fontWeight: "500",
    textAlign: "center",
    lineHeight: Math.max(16, width * 0.04),
  },
  section: {
    marginBottom: Math.max(24, width * 0.06),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Math.max(14, width * 0.035),
  },
  sectionTitle: {
    fontSize: Math.max(18, width * 0.045),
    fontWeight: "700",
    marginLeft: Math.max(10, width * 0.025),
    letterSpacing: 0.3,
  },
  settingsGroup: {
    borderRadius: Math.max(16, width * 0.04),
    borderWidth: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Math.max(16, width * 0.04),
    borderBottomWidth: 0.5,
    minHeight: Math.max(60, width * 0.15), // Consistent row height
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: Math.max(36, width * 0.09),
    height: Math.max(36, width * 0.09),
    borderRadius: Math.max(18, width * 0.045),
    justifyContent: "center",
    alignItems: "center",
    marginRight: Math.max(12, width * 0.03),
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
    marginBottom: Math.max(2, width * 0.005),
    letterSpacing: 0.3,
  },
  settingSubtitle: {
    fontSize: Math.max(13, width * 0.032),
    fontWeight: "500",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  aboutCard: {
    borderRadius: Math.max(16, width * 0.04),
    borderWidth: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: "hidden",
  },
  aboutContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Math.max(20, width * 0.05),
  },
  appIconContainer: {
    width: Math.max(56, width * 0.14),
    height: Math.max(56, width * 0.14),
    borderRadius: Math.max(28, width * 0.07),
    justifyContent: "center",
    alignItems: "center",
    marginRight: Math.max(16, width * 0.04),
  },
  aboutTextContainer: {
    flex: 1,
  },
  appName: {
    fontSize: Math.max(18, width * 0.045),
    fontWeight: "800",
    marginBottom: Math.max(3, width * 0.008),
    letterSpacing: -0.3,
  },
  appVersion: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: "500",
    marginBottom: Math.max(2, width * 0.005),
  },
  appDeveloper: {
    fontSize: Math.max(12, width * 0.03),
    fontWeight: "500",
  },
  statsContainer: {
    borderTopWidth: 0.5,
    paddingVertical: Math.max(16, width * 0.04),
    paddingHorizontal: Math.max(20, width * 0.05),
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: Math.max(20, width * 0.05),
    fontWeight: "800",
    marginBottom: Math.max(3, width * 0.008),
  },
  statLabel: {
    fontSize: Math.max(12, width * 0.03),
    fontWeight: "500",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: Math.max(20, width * 0.05),
    borderTopRightRadius: Math.max(20, width * 0.05),
    maxHeight: "80%",
    paddingBottom: Math.max(20, width * 0.05),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Math.max(18, width * 0.045),
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: Math.max(18, width * 0.045),
    fontWeight: "700",
  },
  closeButton: {
    padding: Math.max(8, width * 0.02),
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Math.max(14, width * 0.035),
    marginHorizontal: Math.max(16, width * 0.04),
    marginVertical: 2,
    borderRadius: Math.max(10, width * 0.025),
    backgroundColor: "#f8f9fa",
    minHeight: Math.max(48, width * 0.12),
  },
  selectedCategoryItem: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  categoryText: {
    fontSize: Math.max(15, width * 0.038),
    flex: 1,
    fontWeight: "500",
  },
  selectedCategoryText: {
    fontWeight: "700",
  },
  customCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Math.max(14, width * 0.035),
    margin: Math.max(16, width * 0.04),
    borderRadius: Math.max(10, width * 0.025),
    borderWidth: 1.5,
    borderColor: "#007AFF",
    borderStyle: "dashed",
    backgroundColor: "transparent",
    minHeight: Math.max(48, width * 0.12),
  },
  customCategoryText: {
    fontSize: Math.max(15, width * 0.038),
    color: "#007AFF",
    fontWeight: "700",
    marginLeft: Math.max(6, width * 0.015),
  },
  customInputContainer: {
    padding: Math.max(20, width * 0.05),
  },
  customInputLabel: {
    fontSize: Math.max(15, width * 0.038),
    fontWeight: "700",
    marginBottom: Math.max(10, width * 0.025),
  },
  customTextInput: {
    borderWidth: 1.5,
    borderRadius: Math.max(10, width * 0.025),
    padding: Math.max(14, width * 0.035),
    fontSize: Math.max(15, width * 0.038),
    marginBottom: Math.max(16, width * 0.04),
    minHeight: Math.max(48, width * 0.12),
  },
  customInputButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Math.max(10, width * 0.025),
  },
  cancelButton: {
    flex: 1,
    padding: Math.max(14, width * 0.035),
    borderRadius: Math.max(10, width * 0.025),
    borderWidth: 1.5,
    alignItems: "center",
    minHeight: Math.max(48, width * 0.12),
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: Math.max(15, width * 0.038),
    fontWeight: "700",
  },
  addButton: {
    flex: 1,
    padding: Math.max(14, width * 0.035),
    borderRadius: Math.max(10, width * 0.025),
    alignItems: "center",
    minHeight: Math.max(48, width * 0.12),
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: "#ccc",
  },
  addButtonText: {
    fontSize: Math.max(15, width * 0.038),
    color: "white",
    fontWeight: "700",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  // New About & Support styles
  appIconText: {
    fontSize: Math.max(18, width * 0.045),
    fontWeight: '900',
    color: 'white',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: Math.max(40, width * 0.1),
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: Math.max(20, width * 0.05),
  },
  supportActions: {
    marginTop: Math.max(16, width * 0.04),
  },
  supportRow: {
    flexDirection: 'row',
    gap: Math.max(12, width * 0.03),
    marginBottom: Math.max(12, width * 0.03),
  },
  supportCard: {
    flex: 1,
    padding: Math.max(16, width * 0.04),
    borderRadius: Math.max(12, width * 0.03),
    alignItems: 'center',
    borderWidth: 1,
    minHeight: Math.max(100, width * 0.25),
  },
  supportIcon: {
    width: Math.max(40, width * 0.1),
    height: Math.max(40, width * 0.1),
    borderRadius: Math.max(20, width * 0.05),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Math.max(8, width * 0.02),
  },
  supportTitle: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Math.max(4, width * 0.01),
  },
  supportSubtitle: {
    fontSize: Math.max(12, width * 0.03),
    textAlign: 'center',
    lineHeight: Math.max(16, width * 0.04),
  },
  feedbackCard: {
    padding: Math.max(16, width * 0.04),
    borderRadius: Math.max(12, width * 0.03),
    borderWidth: 1,
  },
  feedbackContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackIcon: {
    width: Math.max(40, width * 0.1),
    height: Math.max(40, width * 0.1),
    borderRadius: Math.max(20, width * 0.05),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.max(12, width * 0.03),
  },
  feedbackText: {
    flex: 1,
  },
  feedbackTitle: {
    fontSize: Math.max(16, width * 0.04),
    fontWeight: '600',
    marginBottom: Math.max(4, width * 0.01),
  },
  feedbackSubtitle: {
    fontSize: Math.max(14, width * 0.035),
    lineHeight: Math.max(18, width * 0.045),
  },
  appInfoCard: {
    marginTop: Math.max(16, width * 0.04),
    padding: Math.max(16, width * 0.04),
    borderRadius: Math.max(12, width * 0.03),
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.max(12, width * 0.03),
  },
  infoLabel: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: '500',
  },
  infoValue: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: '600',
  },
  infoDivider: {
    height: 1,
    marginHorizontal: 0,
  },
});
