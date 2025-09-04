import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AntDesign } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { CATEGORIES, CURRENCIES } from "../services/SettingsService";
import { getTheme } from "../utils/themes";

const { width } = Dimensions.get("window");

export default function AddExpenseScreen() {
  const { addExpense, settings } = useApp();
  const theme = getTheme(settings.theme);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(settings.defaultCategory);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    const amountNum = parseFloat(amount);
    if (!amount.trim() || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Please enter a valid positive amount";
    }

    if (!category) {
      newErrors.category = "Please select a category";
    }

    if (date > new Date()) {
      newErrors.date = "Date cannot be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showCategoryPicker = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setShowCategoryModal(false);
    setShowCustomInput(false);
    setCustomCategory("");
    // Clear category error if it exists
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: "" }));
    }
  };

  const handleCustomCategorySubmit = () => {
    if (customCategory.trim()) {
      handleCategorySelect(customCategory.trim());
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const newExpense = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        description: description.trim(),
      };

      await addExpense(newExpense);

      Alert.alert("Success", "Expense added successfully!", [
        { text: "OK", onPress: resetForm },
      ]);
    } catch (error) {
      console.error("Error adding expense:", error);
      Alert.alert("Error", "Failed to add expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory(settings.defaultCategory);
    setDate(new Date());
    setDescription("");
    setErrors({});
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate && event.type !== "dismissed") {
      setDate(selectedDate);
    }
    if (event.type === "dismissed") {
      setShowDatePicker(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCurrencySymbol = (): string => {
    const currency = CURRENCIES.find((c) => c.code === settings.currency);
    return currency ? currency.symbol : settings.currency;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}>
          Add your Expense
        </Text>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
          <TextInput
            style={[
              styles.input,
              errors.title && styles.inputError,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter expense title"
            placeholderTextColor={theme.textSecondary}
          />
          {errors.title && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.title}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>
            Amount ({getCurrencySymbol()}) *
          </Text>
          <TextInput
            style={[
              styles.input,
              errors.amount && styles.inputError,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
          {errors.amount && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.amount}
            </Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Category *</Text>
          <TouchableOpacity
            style={[
              styles.categorySelector,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              },
              errors.category && styles.inputError,
            ]}
            onPress={showCategoryPicker}
          >
            <Text style={[styles.categorySelectorText, { color: theme.text }]}>
              {category}
            </Text>
            <AntDesign name="down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
          <TouchableOpacity
            style={[
              styles.dateButton,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
              },
              errors.date && styles.inputError,
            ]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={[styles.dateText, { color: theme.text }]}>
              {formatDate(date)}
            </Text>
            <AntDesign name="calendar" size={20} color={theme.accent} />
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {showDatePicker && Platform.OS === "ios" && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View
              style={[
                styles.datePickerModal,
                { backgroundColor: theme.modalOverlay },
              ]}
            >
              <View
                style={[
                  styles.datePickerContainer,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <View
                  style={[
                    styles.datePickerHeader,
                    { borderBottomColor: theme.border },
                  ]}
                >
                  <Text style={[styles.datePickerTitle, { color: theme.text }]}>
                    Select Date
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.datePickerDone,
                      { backgroundColor: theme.accent },
                    ]}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  textColor={theme.accent}
                />
              </View>
            </View>
          </Modal>
        )}

        {showDatePicker && Platform.OS === "android" && (
          <DateTimePicker
            value={date}
            mode="date"
            display="calendar"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: theme.text }]}>Description</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.text,
              },
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.clearButton,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={resetForm}
            disabled={loading}
          >
            <AntDesign name="reload1" size={16} color={theme.textSecondary} />
            <Text
              style={[styles.clearButtonText, { color: theme.textSecondary }]}
            >
              Clear
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              { backgroundColor: theme.accent },
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <AntDesign name="save" size={16} color="white" />
                <Text style={styles.saveButtonText}>Save Expense</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Selection Modal */}
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
                        {
                          backgroundColor:
                            category === item
                              ? theme.accent + "20"
                              : "transparent",
                          borderBottomColor: theme.border,
                        },
                      ]}
                      onPress={() => handleCategorySelect(item)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          {
                            color:
                              category === item ? theme.accent : theme.text,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                      {category === item && (
                        <AntDesign
                          name="check"
                          size={20}
                          color={theme.accent}
                        />
                      )}
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity
                  style={[
                    styles.customCategoryButton,
                    { borderTopColor: theme.border },
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
                  contentContainerStyle={styles.customInputContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
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
                    returnKeyType="done"
                    onSubmitEditing={handleCustomCategorySubmit}
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
                </ScrollView>
              </KeyboardAvoidingView>
            )}
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
  content: {
    padding: Math.max(20, width * 0.05), // Responsive padding
    paddingTop: Math.max(24, width * 0.06),
  },
  header: {
    fontSize: Math.max(28, width * 0.075), // Responsive font size
    fontWeight: "800",
    color: "#333",
    marginTop: Math.max(32, width * 0.08),
    marginBottom: Math.max(32, width * 0.08),
    textAlign: "center",
    letterSpacing: -0.5,
  },
  formGroup: {
    marginBottom: Math.max(24, width * 0.06),
  },
  label: {
    fontSize: Math.max(16, width * 0.042),
    fontWeight: "700",
    marginBottom: Math.max(10, width * 0.025),
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Math.max(12, width * 0.03),
    padding: Math.max(16, width * 0.04),
    fontSize: Math.max(16, width * 0.04),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: Math.max(50, width * 0.125), // Consistent minimum height
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 2,
  },
  textArea: {
    height: Math.max(100, width * 0.25), // Responsive height
    textAlignVertical: "top",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: Math.max(12, width * 0.03),
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  picker: {
    height: Math.max(50, width * 0.125),
  },
  dateButton: {
    backgroundColor: "white",
    borderWidth: 1.5,
    borderColor: "#ddd",
    borderRadius: Math.max(12, width * 0.03),
    padding: Math.max(16, width * 0.04),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: Math.max(50, width * 0.125),
  },
  dateText: {
    fontSize: Math.max(16, width * 0.04),
    color: "#333",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: Math.max(13, width * 0.032),
    marginTop: Math.max(6, width * 0.015),
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Math.max(28, width * 0.07),
    gap: Math.max(12, width * 0.03),
  },
  button: {
    flex: 1,
    paddingVertical: Math.max(14, width * 0.035),
    borderRadius: Math.max(12, width * 0.03),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: Math.max(48, width * 0.12),
  },
  clearButton: {
    borderWidth: 1.5,
  },
  saveButton: {
    // backgroundColor will be set via theme
  },
  clearButtonText: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
    marginLeft: Math.max(6, width * 0.015),
  },
  saveButtonText: {
    color: "white",
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
    marginLeft: Math.max(6, width * 0.015),
  },
  // Category selector styles
  categorySelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Math.max(16, width * 0.04),
    borderRadius: Math.max(12, width * 0.03),
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: Math.max(50, width * 0.125),
  },
  categorySelectorText: {
    fontSize: Math.max(16, width * 0.04),
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: Math.max(20, width * 0.05),
    borderTopRightRadius: Math.max(20, width * 0.05),
    maxHeight: "85%",
    minHeight: "50%",
    paddingBottom: Math.max(20, width * 0.05),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Math.max(20, width * 0.05),
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
    minHeight: Math.max(48, width * 0.12),
  },
  categoryText: {
    fontSize: Math.max(15, width * 0.04),
    flex: 1,
    fontWeight: "500",
  },
  customCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Math.max(14, width * 0.035),
    margin: Math.max(16, width * 0.04),
    borderRadius: Math.max(10, width * 0.025),
    borderWidth: 1.5,
    borderStyle: "dashed",
    backgroundColor: "transparent",
    minHeight: Math.max(48, width * 0.12),
  },
  customCategoryText: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
    marginLeft: Math.max(8, width * 0.02),
  },
  customInputContainer: {
    padding: Math.max(20, width * 0.05),
    minHeight: Math.max(180, width * 0.45),
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  customInputLabel: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
    marginBottom: Math.max(10, width * 0.025),
  },
  customTextInput: {
    borderWidth: 1.5,
    borderRadius: Math.max(10, width * 0.025),
    padding: Math.max(14, width * 0.035),
    fontSize: Math.max(15, width * 0.04),
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
    fontSize: Math.max(15, width * 0.04),
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
    fontSize: Math.max(15, width * 0.04),
    color: "white",
    fontWeight: "700",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    borderTopLeftRadius: Math.max(20, width * 0.05),
    borderTopRightRadius: Math.max(20, width * 0.05),
    padding: Math.max(20, width * 0.05),
    paddingBottom: Math.max(32, width * 0.08),
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Math.max(16, width * 0.04),
    paddingBottom: Math.max(10, width * 0.025),
    borderBottomWidth: 0.5,
  },
  datePickerTitle: {
    fontSize: Math.max(17, width * 0.043),
    fontWeight: "700",
  },
  datePickerDone: {
    paddingHorizontal: Math.max(14, width * 0.035),
    paddingVertical: Math.max(8, width * 0.02),
    borderRadius: Math.max(8, width * 0.02),
  },
  datePickerDoneText: {
    color: "white",
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
  },
});
