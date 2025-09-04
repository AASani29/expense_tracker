import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { settingsService } from '../services/SettingsService';
import { getTheme } from '../utils/themes';

const { width } = Dimensions.get('window');

export default function BudgetScreen() {
  const { settings, updateSettings, expenses } = useApp();
  const theme = getTheme(settings.theme);
  const [budgetInput, setBudgetInput] = useState('');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetProgress, setBudgetProgress] = useState({
    percentage: 0,
    remaining: 0,
    exceeded: false,
    currentSpending: 0,
  });

  useEffect(() => {
    calculateBudgetProgress();
  }, [expenses, settings.monthlyBudget]);

  const calculateBudgetProgress = async () => {
    try {
      // Get current month expenses
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
      });
      
      const currentSpending = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const progress = await settingsService.getBudgetProgress(currentSpending);
      
      setBudgetProgress({
        ...progress,
        currentSpending,
      });
    } catch (error) {
      console.error('Error calculating budget progress:', error);
    }
  };

  const handleBudgetUpdate = async () => {
    const budget = parseFloat(budgetInput);
    if (isNaN(budget) || budget <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    try {
      await updateSettings({ monthlyBudget: budget });
      setShowBudgetModal(false);
      setBudgetInput('');
      Alert.alert('Success', 'Monthly budget updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update budget');
    }
  };

  const getProgressColor = () => {
    if (budgetProgress.percentage >= 100) return '#FF4444';
    if (budgetProgress.percentage >= 80) return '#FF8800';
    if (budgetProgress.percentage >= 60) return '#FFAA00';
    return theme.accent;
  };

  const getProgressWidth = () => {
    return Math.min(budgetProgress.percentage, 100);
  };

  const formatAmount = (amount: number) => {
    return settingsService.formatAmount(amount, settings.currency);
  };

  const getCategoryExpenses = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    const categoryTotals: { [key: string]: number } = {};
    monthlyExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Budget Overview
        </Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.accent }]}
          onPress={() => setShowBudgetModal(true)}
        >
          <AntDesign name="edit" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Budget Progress Card */}
      <View style={[styles.budgetCard, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.budgetHeader}>
          <Text style={[styles.budgetTitle, { color: theme.text }]}>
            Monthly Budget
          </Text>
          <Text style={[styles.budgetAmount, { color: theme.accent }]}>
            {formatAmount(settings.monthlyBudget)}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: getProgressColor(),
                  width: `${getProgressWidth()}%`,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: getProgressColor() }]}>
            {budgetProgress.percentage.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.budgetDetails}>
          <View style={styles.budgetItem}>
            <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>
              Spent
            </Text>
            <Text style={[styles.budgetValue, { color: theme.text }]}>
              {formatAmount(budgetProgress.currentSpending)}
            </Text>
          </View>
          <View style={styles.budgetItem}>
            <Text style={[styles.budgetLabel, { color: theme.textSecondary }]}>
              {budgetProgress.exceeded ? 'Over Budget' : 'Remaining'}
            </Text>
            <Text style={[
              styles.budgetValue,
              { color: budgetProgress.exceeded ? '#FF4444' : theme.accent }
            ]}>
              {formatAmount(Math.abs(budgetProgress.remaining))}
            </Text>
          </View>
        </View>
      </View>

      {/* Category Breakdown */}
      <View style={[styles.categoryCard, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.categoryTitle, { color: theme.text }]}>
          This Month by Category
        </Text>
        {getCategoryExpenses().slice(0, 6).map((item, index) => (
          <View key={item.category} style={styles.categoryItem}>
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {item.category}
            </Text>
            <Text style={[styles.categoryAmount, { color: theme.textSecondary }]}>
              {formatAmount(item.amount)}
            </Text>
          </View>
        ))}
        {getCategoryExpenses().length === 0 && (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No expenses this month
          </Text>
        )}
      </View>

      {/* Budget Modal */}
      <Modal
        visible={showBudgetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Set Monthly Budget
            </Text>
            <TextInput
              style={[
                styles.budgetTextInput,
                {
                  backgroundColor: theme.background,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={budgetInput}
              onChangeText={setBudgetInput}
              placeholder={`Enter budget (${settings.currency})`}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.border }]}
                onPress={() => setShowBudgetModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleBudgetUpdate}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Save
                </Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetCard: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 45,
  },
  budgetDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetItem: {
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  budgetTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
