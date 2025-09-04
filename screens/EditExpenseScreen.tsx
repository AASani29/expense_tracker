import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AntDesign } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { Expense } from "../services/DatabaseService";
import { CATEGORIES } from "../services/SettingsService";
import { getTheme } from "../utils/themes";

const { width } = Dimensions.get("window");

const EditExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { updateExpense, settings } = useApp();
  const theme = getTheme(settings.theme);

  const { expense } = route.params as { expense: Expense };

  const [title, setTitle] = useState(expense.title);
  const [amount, setAmount] = useState(expense.amount.toString());
  const [category, setCategory] = useState(expense.category);
  const [date, setDate] = useState(new Date(expense.date));
  const [description, setDescription] = useState(expense.description || "");
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const updatedExpense = {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        description: description.trim(),
      };

      if (expense.id) {
        await updateExpense(expense.id, updatedExpense);
        Alert.alert("Success", "Expense updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      Alert.alert("Error", "Failed to update expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}>Edit Expense</Text>

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
            Amount ({settings.currency}) *
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
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.category}
            </Text>
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
          {errors.date && (
            <Text style={[styles.errorText, { color: theme.error }]}>
              {errors.date}
            </Text>
          )}
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
              styles.cancelButton,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              },
            ]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text
              style={[styles.cancelButtonText, { color: theme.textSecondary }]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.submitButton,
              { backgroundColor: theme.accent },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <AntDesign name="save" size={16} color="white" />
                <Text style={styles.submitButtonText}>Update</Text>
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
                        styles.cancelModalButton,
                        {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.border,
                        },
                      ]}
                      onPress={() => {
                        setShowCustomInput(false);
                        setCustomCategory("");
                      }}
                    >
                      <Text
                        style={[
                          styles.cancelModalButtonText,
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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Math.max(20, width * 0.05),
  },
  header: {
    fontSize: Math.max(28, width * 0.075),
    fontWeight: "800",
    marginBottom: Math.max(32, width * 0.08),
    textAlign: "center",
    letterSpacing: -0.5,
  },
  formGroup: {
    marginBottom: Math.max(24, width * 0.06),
  },
  label: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
    marginBottom: Math.max(10, width * 0.025),
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: Math.max(12, width * 0.03),
    padding: Math.max(16, width * 0.04),
    fontSize: Math.max(15, width * 0.04),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: Math.max(48, width * 0.12),
  },
  inputError: {
    borderColor: "#FF3B30",
    borderWidth: 1.5,
  },
  textArea: {
    height: Math.max(100, width * 0.25),
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1.5,
    borderRadius: Math.max(12, width * 0.03),
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  picker: {
    height: Math.max(48, width * 0.12),
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
    minHeight: Math.max(48, width * 0.12),
  },
  dateText: {
    fontSize: Math.max(15, width * 0.04),
    color: "#333",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: Math.max(13, width * 0.033),
    marginTop: Math.max(4, width * 0.01),
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
    borderRadius: Math.max(16, width * 0.04),
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    minHeight: Math.max(48, width * 0.12),
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  submitButton: {
    // backgroundColor handled by theme
  },
  cancelButtonText: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
  },
  submitButtonText: {
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
    minHeight: Math.max(48, width * 0.12),
  },
  categorySelectorText: {
    fontSize: Math.max(15, width * 0.04),
    flex: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: Math.max(16, width * 0.04),
    borderTopRightRadius: Math.max(16, width * 0.04),
    maxHeight: "90%",
    minHeight: "50%",
    paddingBottom: Math.max(16, width * 0.04),
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
    minHeight: Math.max(48, width * 0.12),
  },
  selectedCategoryItem: {
    backgroundColor: "#e3f2fd",
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  categoryText: {
    fontSize: Math.max(14, width * 0.037),
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
    borderStyle: "dashed",
    backgroundColor: "transparent",
    minHeight: Math.max(48, width * 0.12),
  },
  customCategoryText: {
    fontSize: Math.max(14, width * 0.037),
    fontWeight: "700",
    marginLeft: Math.max(6, width * 0.015),
  },
  customInputContainer: {
    padding: Math.max(18, width * 0.045),
    minHeight: Math.max(160, width * 0.4),
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  customInputLabel: {
    fontSize: Math.max(14, width * 0.037),
    fontWeight: "700",
    marginBottom: Math.max(10, width * 0.025),
  },
  customTextInput: {
    borderWidth: 1.5,
    borderRadius: Math.max(10, width * 0.025),
    padding: Math.max(14, width * 0.035),
    fontSize: Math.max(14, width * 0.037),
    marginBottom: Math.max(16, width * 0.04),
    minHeight: Math.max(48, width * 0.12),
  },
  customInputButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Math.max(10, width * 0.025),
  },
  cancelModalButton: {
    flex: 1,
    padding: Math.max(14, width * 0.035),
    borderRadius: Math.max(10, width * 0.025),
    borderWidth: 1.5,
    alignItems: "center",
    minHeight: Math.max(48, width * 0.12),
    justifyContent: "center",
  },
  cancelModalButtonText: {
    fontSize: Math.max(14, width * 0.037),
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
    fontSize: Math.max(14, width * 0.037),
    color: "white",
    fontWeight: "700",
  },
  // Date picker modal styles
  datePickerModal: {
    flex: 1,
    justifyContent: "flex-end",
  },
  datePickerContainer: {
    borderTopLeftRadius: Math.max(16, width * 0.04),
    borderTopRightRadius: Math.max(16, width * 0.04),
    padding: Math.max(18, width * 0.045),
    paddingBottom: Math.max(32, width * 0.08),
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Math.max(16, width * 0.04),
    paddingBottom: Math.max(8, width * 0.02),
    borderBottomWidth: 0.5,
  },
  datePickerTitle: {
    fontSize: Math.max(16, width * 0.042),
    fontWeight: "700",
  },
  datePickerDone: {
    paddingHorizontal: Math.max(14, width * 0.035),
    paddingVertical: Math.max(8, width * 0.02),
    borderRadius: Math.max(8, width * 0.02),
  },
  datePickerDoneText: {
    color: "white",
    fontSize: Math.max(14, width * 0.037),
    fontWeight: "600",
  },
});

export default EditExpenseScreen;
