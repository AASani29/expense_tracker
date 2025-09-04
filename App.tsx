import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import AntDesign from "@expo/vector-icons/AntDesign";

import { AppProvider, useApp } from "./context/AppContext";
import { getTheme } from "./utils/themes";
import ExpensesScreen from "./screens/ExpensesScreen";
import AddExpenseScreen from "./screens/AddExpenseScreen";
import StatsScreen from "./screens/StatsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import BudgetScreen from "./screens/BudgetScreen";
import ExpenseDetailsScreen from "./screens/ExpenseDetailsScreen";
import EditExpenseScreen from "./screens/EditExpenseScreen";
import AuthenticationScreen from "./screens/AuthenticationScreen";
import CurrencySelectionScreen from "./screens/CurrencySelectionScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Expenses
function ExpensesStack() {
  const { settings } = useApp();
  const theme = getTheme(settings.theme);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          color: theme.text,
        },
      }}
    >
      <Stack.Screen name="ExpensesList" component={ExpensesScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen
        name="ExpenseDetails"
        component={ExpenseDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditExpense"
        component={EditExpenseScreen}
        options={{
          headerShown: true,
          title: "",
          headerStyle: {
            backgroundColor: theme.cardBackground,
            shadowColor: settings.theme === "dark" ? "transparent" : "#000",
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Stack Navigator for Settings
function SettingsStack() {
  const { settings } = useApp();
  const theme = getTheme(settings.theme);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: theme.cardBackground,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          color: theme.text,
        },
      }}
    >
      <Stack.Screen name="SettingsList" component={SettingsScreen} />
      <Stack.Screen
        name="CurrencySelection"
        component={CurrencySelectionScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

// Main Tab Navigator
function TabNavigator() {
  const { settings } = useApp();
  const theme = getTheme(settings.theme);

  return (
    <Tab.Navigator
      screenOptions={({ route }: { route: any }) => ({
        tabBarIcon: ({
          focused,
          color,
          size,
        }: {
          focused: boolean;
          color: string;
          size: number;
        }) => {
          let iconName: keyof typeof AntDesign.glyphMap;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Budget") {
            iconName = "wallet";
          } else if (route.name === "Stats") {
            iconName = "barschart";
          } else if (route.name === "Settings") {
            iconName = "setting";
          } else {
            iconName = "home";
          }

          return <AntDesign name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.cardBackground,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={ExpensesStack} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}

// Main App Component
function AppContent() {
  const { loading, isAuthenticated, settings } = useApp();
  const theme = getTheme(settings.theme);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!isAuthenticated && (settings.pinEnabled || settings.biometricEnabled)) {
    return <AuthenticationScreen />;
  }

  return <TabNavigator />;
}

export default function App() {
  return (
    <AppProvider>
      <NavigationContainer>
        <AppContent />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AppProvider>
  );
}
