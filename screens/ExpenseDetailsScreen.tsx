import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AntDesign } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Expense } from "../services/DatabaseService";
import { settingsService } from "../services/SettingsService";
import { getTheme } from "../utils/themes";

type RootStackParamList = {
  ExpenseDetails: { expenseId: number };
  EditExpense: { expense: Expense };
};

type ExpenseDetailsNavigationProp = StackNavigationProp<RootStackParamList>;

const ExpenseDetailsScreen: React.FC = () => {
  const navigation = useNavigation<ExpenseDetailsNavigationProp>();
  const route = useRoute();
  const { deleteExpense, settings } = useApp();
  const theme = getTheme(settings.theme);
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  const params = route.params as { expenseId: number };
  const expenseId = params?.expenseId;

  useEffect(() => {
    loadExpenseDetails();
  }, [expenseId]);

  const loadExpenseDetails = async () => {
    try {
      setLoading(true);
      // In a real implementation, you'd fetch the specific expense by ID
      // For now, we'll use the passed data
      const { databaseService } = await import("../services/DatabaseService");
      const expenseData = await databaseService.getExpenseById(expenseId);
      setExpense(expenseData);
    } catch (error) {
      console.error("Error loading expense details:", error);
      Alert.alert("Error", "Failed to load expense details");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (expense) {
      navigation.navigate("EditExpense", { expense });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      if (expense?.id) {
        await deleteExpense(expense.id);
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to delete expense");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return settingsService.formatAmount(amount, settings.currency);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: keyof typeof AntDesign.glyphMap } = {
      // Food & Dining
      "Food & Dining": "apple1",
      Groceries: "shoppingcart",

      // Transportation
      Transportation: "car",
      "Gas & Fuel": "car",

      // Entertainment
      Entertainment: "videocamera",
      "Movies & Shows": "playcircleo",

      // Shopping
      Shopping: "shoppingcart",
      Clothing: "skin",
      Electronics: "mobile1",

      // Bills & Utilities
      "Bills & Utilities": "filetext1",
      Rent: "home",
      "Internet & Phone": "wifi",

      // Healthcare
      Healthcare: "medicinebox",
      Insurance: "Safety",

      // Education
      Education: "book",
      Books: "book",

      // Travel
      Travel: "earth",
      Hotels: "home",

      // Sports & Fitness
      "Sports & Fitness": "Trophy",

      // Beauty & Personal Care
      "Beauty & Personal Care": "heart",

      // Home & Garden
      "Home & Garden": "home",

      // Gifts & Donations
      "Gifts & Donations": "gift",

      // Business
      Business: "laptop",

      // Financial
      Taxes: "filetext1",
      Investments: "linechart",

      // Legacy categories (for backward compatibility)
      Food: "apple1",
      Bills: "filetext1",
      Other: "ellipsis1",
    };
    return iconMap[category] || "ellipsis1";
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading expense details...
        </Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.errorText, { color: theme.text }]}>
          Expense not found
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.accent }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Custom Header */}
      <View
        style={[
          styles.customHeader,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Expense Details
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <View
            style={[
              styles.header,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                shadowColor: settings.theme === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            <Text style={[styles.title, { color: theme.text }]}>
              {expense.title}
            </Text>
            <Text style={[styles.amount, { color: theme.accent }]}>
              {formatAmount(expense.amount)}
            </Text>
          </View>

          <View
            style={[
              styles.detailsContainer,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                shadowColor: settings.theme === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Category:
              </Text>
              <View style={styles.categoryContainer}>
                <View
                  style={[
                    styles.categoryIconContainer,
                    { backgroundColor: theme.accent + "20" },
                  ]}
                >
                  <AntDesign
                    name={getCategoryIcon(expense.category)}
                    size={16}
                    color={theme.accent}
                  />
                </View>
                <View
                  style={[
                    styles.categoryTag,
                    { backgroundColor: theme.accent },
                  ]}
                >
                  <Text style={styles.categoryText}>{expense.category}</Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Date:
              </Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {formatDate(expense.date)}
              </Text>
            </View>

            {expense.description && (
              <View style={styles.detailColumn}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                  Description:
                </Text>
                <Text style={[styles.description, { color: theme.text }]}>
                  {expense.description}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Created:
              </Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {expense.created_at ? formatDate(expense.created_at) : "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.editButton,
                { backgroundColor: theme.accent },
              ]}
              onPress={handleEdit}
            >
              <AntDesign name="edit" size={20} color="white" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <AntDesign name="delete" size={20} color="white" />
              <Text style={styles.actionButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 0,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginRight: 40, // Compensate for back button width
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40, // Same as back button width for centering
  },
  scrollContainer: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
  },
  header: {
    padding: 32,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  amount: {
    fontSize: 36,
    fontWeight: "900",
  },
  detailsContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailColumn: {
    marginBottom: 20,
  },
  label: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  value: {
    fontSize: 17,
    fontWeight: "500",
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    fontSize: 17,
    marginTop: 12,
    lineHeight: 26,
    fontWeight: "400",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
    flex: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  editButton: {
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  actionButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginLeft: 8,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    marginTop: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
  },
});

export default ExpenseDetailsScreen;
