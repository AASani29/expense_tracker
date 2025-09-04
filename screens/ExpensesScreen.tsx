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
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import Constants from "expo-constants";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useApp } from "../context/AppContext";
import { Expense } from "../services/DatabaseService";
import { settingsService, CATEGORIES } from "../services/SettingsService";
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
    addExpense,
    settings,
  } = useApp();
  const theme = getTheme(settings.theme);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // Modal form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState(settings.defaultCategory);
  const [formDate, setFormDate] = useState(new Date());
  const [formDescription, setFormDescription] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);

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

  // Form validation and handlers
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formTitle.trim()) {
      newErrors.title = "Title is required";
    }

    const amountNum = parseFloat(formAmount);
    if (!formAmount.trim() || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Please enter a valid positive amount";
    }

    if (!formCategory) {
      newErrors.category = "Please select a category";
    }

    if (formDate > new Date()) {
      newErrors.date = "Date cannot be in the future";
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setFormLoading(true);
      const newExpense = {
        title: formTitle.trim(),
        amount: parseFloat(formAmount),
        category: formCategory,
        date: formDate.toISOString().split("T")[0],
        description: formDescription.trim(),
      };

      await addExpense(newExpense);
      resetForm();
      setShowAddModal(false);
      Alert.alert("Success", "Expense added successfully!");
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to add expense. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormAmount("");
    setFormCategory(settings.defaultCategory);
    setFormDate(new Date());
    setFormDescription("");
    setFormErrors({});
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== "dismissed") {
      setFormDate(selectedDate);
    }
    if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  const formatFormDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setFormCategory(selectedCategory);
    setShowCategoryModal(false);
    if (formErrors.category) {
      setFormErrors((prev) => ({ ...prev, category: "" }));
    }
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
          <View style={styles.logoContainer}>
            <View style={styles.logoTextContainer}>
              <View style={styles.logoMainText}>
                <Text style={[styles.logoText, { color: theme.accent }]}>
                  EXPEN
                </Text>
                <Text style={[styles.logoTextDollar, { color: theme.accent }]}>
                  $
                </Text>
                <Text style={[styles.logoText, { color: theme.accent }]}>
                  IO
                </Text>
              </View>
              <Text style={[styles.logoSubtext, { color: theme.textSecondary }]}>
                Smart Spending
              </Text>
            </View>
            <View style={[styles.logoUnderline, { backgroundColor: theme.accent }]} />
          </View>
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
          <View style={[styles.summaryCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.summaryContent}>
              <View style={styles.summaryTextSection}>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
                  Total Spending
                </Text>
                <Text style={[styles.summaryAmount, { color: theme.accent }]}>
                  {formatAmount(
                    filteredExpenses.reduce(
                      (sum, expense) => sum + expense.amount,
                      0
                    )
                  )}
                </Text>
                <Text style={[styles.expenseCount, { color: theme.textSecondary }]}>
                  {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""} • This period
                </Text>
              </View>
              <View style={styles.summaryIconSection}>
                <View style={[styles.summaryIcon, { backgroundColor: theme.accent + '15' }]}>
                  <AntDesign name="wallet" size={24} color={theme.accent} />
                </View>
              </View>
            </View>
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
      
      {/* Floating Add Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.accent }]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <AntDesign name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setShowAddModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Add Expense</Text>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
                style={styles.modalCloseButton}
              >
                <AntDesign name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Title *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { 
                      borderColor: formErrors.title ? '#ff4444' : theme.inputBorder,
                      backgroundColor: theme.inputBackground,
                      color: theme.text 
                    }
                  ]}
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="Enter expense title"
                  placeholderTextColor={theme.textSecondary}
                />
                {formErrors.title && (
                  <Text style={styles.errorText}>{formErrors.title}</Text>
                )}
              </View>

              {/* Amount Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Amount *</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    { 
                      borderColor: formErrors.amount ? '#ff4444' : theme.inputBorder,
                      backgroundColor: theme.inputBackground,
                      color: theme.text 
                    }
                  ]}
                  value={formAmount}
                  onChangeText={setFormAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
                {formErrors.amount && (
                  <Text style={styles.errorText}>{formErrors.amount}</Text>
                )}
              </View>

              {/* Category Picker */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Category *</Text>
                <TouchableOpacity
                  style={[
                    styles.formInput,
                    styles.categoryPicker,
                    { 
                      borderColor: formErrors.category ? '#ff4444' : theme.inputBorder,
                      backgroundColor: theme.inputBackground 
                    }
                  ]}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Text style={[styles.categoryText, { color: theme.text }]}>
                    {formCategory}
                  </Text>
                  <AntDesign name="down" size={14} color={theme.textSecondary} />
                </TouchableOpacity>
                {formErrors.category && (
                  <Text style={styles.errorText}>{formErrors.category}</Text>
                )}
              </View>

              {/* Date Picker */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Date</Text>
                <TouchableOpacity
                  style={[
                    styles.formInput,
                    styles.datePicker,
                    { 
                      borderColor: theme.inputBorder,
                      backgroundColor: theme.inputBackground 
                    }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateText, { color: theme.text }]}>
                    {formatFormDate(formDate)}
                  </Text>
                  <AntDesign name="calendar" size={14} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Description Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.text }]}>Description</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    styles.descriptionInput,
                    { 
                      borderColor: theme.inputBorder,
                      backgroundColor: theme.inputBackground,
                      color: theme.text 
                    }
                  ]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Add a note (optional)"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: theme.inputBorder }]}
                onPress={() => {
                  resetForm();
                  setShowAddModal(false);
                }}
              >
                <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleFormSave}
                style={[styles.saveButton, { backgroundColor: theme.accent }]}
                disabled={formLoading}
              >
                {formLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <View style={[styles.categoryModalContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.categoryModalHeader, { borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <AntDesign name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.categoryModalTitle, { color: theme.text }]}>
                Select Category
              </Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.categoryList}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    { backgroundColor: theme.cardBackground },
                    formCategory === cat && { backgroundColor: theme.accent + '20' }
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Text style={[
                    styles.categoryItemText, 
                    { color: theme.text },
                    formCategory === cat && { color: theme.accent, fontWeight: '600' }
                  ]}>
                    {cat}
                  </Text>
                  {formCategory === cat && (
                    <AntDesign name="check" size={16} color={theme.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </Modal>
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
    marginBottom: Math.max(8, width * 0.02),
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
  summaryCard: {
    marginHorizontal: Math.max(16, width * 0.04),
    marginTop: Math.max(16, width * 0.04),
    marginBottom: Math.max(12, width * 0.03),
    padding: Math.max(20, width * 0.05),
    borderRadius: Math.max(16, width * 0.04),
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTextSection: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Math.max(8, width * 0.02),
  },
  summaryAmount: {
    fontSize: Math.max(24, width * 0.06),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Math.max(6, width * 0.015),
  },
  expenseCount: {
    fontSize: Math.max(12, width * 0.03),
    fontWeight: '500',
    opacity: 0.8,
  },
  summaryIconSection: {
    marginLeft: Math.max(16, width * 0.04),
  },
  summaryIcon: {
    width: Math.max(48, width * 0.12),
    height: Math.max(48, width * 0.12),
    borderRadius: Math.max(24, width * 0.06),
    justifyContent: 'center',
    alignItems: 'center',
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
  titleContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  logoContainer: {
    alignItems: "flex-start",
  },
  logoTextContainer: {
    justifyContent: 'center',
  },
  logoMainText: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: Math.max(28, width * 0.07),
    fontWeight: "900",
    letterSpacing: -0.5,
    textTransform: "uppercase",
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
    lineHeight: Math.max(30, width * 0.075),
  },
  logoTextDollar: {
    fontSize: Math.max(32, width * 0.08),
    fontWeight: "900",
    letterSpacing: -0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-black',
    lineHeight: Math.max(30, width * 0.075),
    marginHorizontal: -1,
    transform: [{ scaleX: 1.1 }],
  },
  logoSubtext: {
    fontSize: Math.max(11, width * 0.028),
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: -2,
    opacity: 0.7,
  },
  logoUnderline: {
    height: 2,
    width: Math.max(80, width * 0.2),
    borderRadius: 1,
    marginTop: 2,
  },
  floatingButton: {
    position: 'absolute',
    bottom: Math.max(25, width * 0.06),
    right: Math.max(20, width * 0.05),
    width: Math.max(56, width * 0.14),
    height: Math.max(56, width * 0.14),
    borderRadius: Math.max(28, width * 0.07),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 1000,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginRight: 24,
  },
  modalContent: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  categoryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 16,
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
  },
  descriptionInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 4,
  },
  categoryModalContainer: {
    flex: 1,
  },
  categoryModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: Constants.statusBarHeight + 16,
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  categoryList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  categoryItemText: {
    fontSize: 16,
  },
});

export default ExpensesScreen;
