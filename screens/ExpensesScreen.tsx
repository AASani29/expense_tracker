import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useApp } from "../context/AppContext";
import { Expense } from "../services/DatabaseService";
import { settingsService } from "../services/SettingsService";
import { ExpensesScreenNavigationProp } from "../types/navigation";
import { getTheme } from "../utils/themes";

const { width } = Dimensions.get("window");

const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<ExpensesScreenNavigationProp>();
  const {
    expenses,
    loading,
    refreshExpenses,
    deleteExpense,
    searchExpenses,
    settings,
  } = useApp();
  const theme = getTheme(settings.theme);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredExpenses(expenses);
    }
  }, [expenses, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshExpenses();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await searchExpenses(searchQuery);
      setFilteredExpenses(results);
    } else {
      setFilteredExpenses(expenses);
    }
  };

  const handleExpensePress = (expense: Expense) => {
    if (expense.id) {
      navigation.navigate("ExpenseDetails", { expenseId: expense.id });
    }
  };

  const handleSwipeDelete = (expense: Expense) => {
    Alert.alert(
      "Delete Expense",
      `Are you sure you want to delete "${expense.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (expense.id) {
              deleteExpense(expense.id);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
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

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      // Food & Dining
      "Food & Dining": "#FF6B6B",
      Groceries: "#FF8E53",

      // Transportation
      Transportation: "#4ECDC4",
      "Gas & Fuel": "#45B7D1",

      // Entertainment
      Entertainment: "#45B7D1",
      "Movies & Shows": "#5D5FEF",

      // Shopping
      Shopping: "#96CEB4",
      Clothing: "#FECA57",
      Electronics: "#5F27CD",

      // Bills & Utilities
      "Bills & Utilities": "#FFEAA7",
      Rent: "#FD79A8",
      "Internet & Phone": "#00B894",

      // Healthcare
      Healthcare: "#DDA0DD",
      Insurance: "#A29BFE",

      // Education
      Education: "#98D8C8",
      Books: "#55A3FF",

      // Travel
      Travel: "#FF7675",
      Hotels: "#FDCB6E",

      // Sports & Fitness
      "Sports & Fitness": "#6C5CE7",

      // Beauty & Personal Care
      "Beauty & Personal Care": "#FD79A8",

      // Home & Garden
      "Home & Garden": "#00B894",

      // Gifts & Donations
      "Gifts & Donations": "#E17055",

      // Business
      Business: "#636E72",

      // Financial
      Taxes: "#2D3436",
      Investments: "#00CEC9",

      // Legacy categories (for backward compatibility)
      Food: "#FF6B6B",
      Bills: "#FFEAA7",
      Other: "#F7DC6F",
    };
    return colorMap[category] || "#F7DC6F";
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity
      style={[
        styles.expenseItem,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.border,
          shadowColor: settings.theme === "dark" ? "transparent" : "#000",
        },
      ]}
      onPress={() => handleExpensePress(item)}
      onLongPress={() => handleSwipeDelete(item)}
    >
      <View style={styles.expenseContent}>
        <View
          style={[
            styles.categoryIcon,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        >
          <AntDesign
            name={getCategoryIcon(item.category)}
            size={24}
            color="white"
          />
        </View>

        <View style={styles.expenseDetails}>
          <Text
            style={[styles.expenseTitle, { color: theme.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.expenseCategory, { color: theme.textSecondary }]}
            numberOfLines={1}
          >
            {item.category}
          </Text>
          <Text style={[styles.expenseDate, { color: theme.textSecondary }]}>
            {formatDate(item.date)}
          </Text>
        </View>

        <View style={styles.expenseAmount}>
          <Text style={[styles.amountText, { color: theme.accent }]}>
            {formatAmount(item.amount)}
          </Text>
          <AntDesign name="right" size={16} color={theme.textSecondary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <AntDesign name="inbox" size={64} color={theme.textSecondary} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No Expenses Found
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        {searchQuery
          ? "Try a different search term"
          : "Add your first expense to get started"}
      </Text>
    </View>
  );

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
          Loading expenses...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
            shadowColor: settings.theme === "dark" ? "transparent" : "#000",
          },
        ]}
      >
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            My Expenses
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <AntDesign
              name={showSearch ? "close" : "search1"}
              size={24}
              color={theme.accent}
            />
          </TouchableOpacity>
        </View>

        {showSearch && (
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.cardBackground },
            ]}
          >
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                  borderColor: theme.inputBorder,
                  backgroundColor: theme.inputBackground,
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search expenses..."
              placeholderTextColor={theme.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearch}
                onPress={() => setSearchQuery("")}
              >
                <AntDesign name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {filteredExpenses.length > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={[styles.summaryText, { color: theme.accent }]}>
              Total:{" "}
              {formatAmount(
                filteredExpenses.reduce(
                  (sum, expense) => sum + expense.amount,
                  0
                )
              )}
            </Text>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>
              {filteredExpenses.length} expense
              {filteredExpenses.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderExpenseItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={
          filteredExpenses.length === 0 ? styles.emptyList : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: Math.max(16, width * 0.04),
    paddingTop: Constants.statusBarHeight + Math.max(16, width * 0.04),
    paddingBottom: Math.max(12, width * 0.03),
    borderBottomWidth: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Math.max(10, width * 0.025),
  },
  headerTitle: {
    fontSize: Math.max(28, width * 0.075), // Responsive font size
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  searchButton: {
    padding: Math.max(8, width * 0.02),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Math.max(10, width * 0.025),
  },
  searchInput: {
    flex: 1,
    borderRadius: Math.max(8, width * 0.02),
    paddingHorizontal: Math.max(12, width * 0.03),
    paddingVertical: Math.max(8, width * 0.02),
    fontSize: Math.max(15, width * 0.04),
    borderWidth: 1,
    minHeight: Math.max(40, width * 0.1),
  },
  clearSearch: {
    padding: Math.max(8, width * 0.02),
    marginLeft: Math.max(8, width * 0.02),
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Math.max(8, width * 0.02),
  },
  summaryText: {
    fontSize: Math.max(16, width * 0.042),
    fontWeight: "700",
  },
  countText: {
    fontSize: Math.max(13, width * 0.032),
    fontWeight: "500",
  },
  expenseItem: {
    marginHorizontal: Math.max(16, width * 0.04),
    marginVertical: Math.max(6, width * 0.015),
    borderRadius: Math.max(16, width * 0.04),
    borderWidth: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  expenseContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Math.max(16, width * 0.04),
  },
  categoryIcon: {
    width: Math.max(44, width * 0.11),
    height: Math.max(44, width * 0.11),
    borderRadius: Math.max(22, width * 0.055),
    justifyContent: "center",
    alignItems: "center",
    marginRight: Math.max(14, width * 0.035),
  },
  expenseDetails: {
    flex: 1,
    justifyContent: "center",
  },
  expenseTitle: {
    fontSize: Math.max(16, width * 0.042),
    fontWeight: "700",
    marginBottom: Math.max(3, width * 0.008),
    lineHeight: Math.max(20, width * 0.05),
  },
  expenseCategory: {
    fontSize: Math.max(14, width * 0.035),
    marginBottom: Math.max(2, width * 0.005),
    fontWeight: "500",
  },
  expenseDate: {
    fontSize: Math.max(12, width * 0.03),
    fontWeight: "500",
  },
  expenseAmount: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: width * 0.2, // Consistent width for amounts
  },
  amountText: {
    fontSize: Math.max(16, width * 0.042),
    fontWeight: "800",
    marginRight: Math.max(6, width * 0.015),
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Math.max(32, width * 0.08),
  },
  emptyList: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: Math.max(18, width * 0.045),
    fontWeight: "700",
    marginTop: Math.max(16, width * 0.04),
    marginBottom: Math.max(8, width * 0.02),
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: Math.max(15, width * 0.038),
    textAlign: "center",
    lineHeight: Math.max(20, width * 0.05),
  },
  loadingText: {
    marginTop: Math.max(12, width * 0.03),
    fontSize: Math.max(15, width * 0.038),
  },
});

export default ExpensesScreen;
