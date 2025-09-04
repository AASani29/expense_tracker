import { StackNavigationProp } from '@react-navigation/stack';
import { Expense } from '../services/DatabaseService';

// Stack Navigator Type Definitions
export type ExpensesStackParamList = {
  ExpensesList: undefined;
  AddExpense: undefined;
  ExpenseDetails: { expenseId: number };
  EditExpense: { expense: Expense };
};

export type SettingsStackParamList = {
  SettingsList: undefined;
  CurrencySelection: undefined;
};

export type TabParamList = {
  Home: undefined;
  Budget: undefined;
  Stats: undefined;
  Settings: undefined;
};

// Navigation Props
export type ExpensesScreenNavigationProp = StackNavigationProp<
  ExpensesStackParamList,
  'ExpensesList'
>;

export type ExpenseDetailsScreenNavigationProp = StackNavigationProp<
  ExpensesStackParamList,
  'ExpenseDetails'
>;

export type EditExpenseScreenNavigationProp = StackNavigationProp<
  ExpensesStackParamList,
  'EditExpense'
>;

export type SettingsScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'SettingsList'
>;

export type CurrencySelectionScreenNavigationProp = StackNavigationProp<
  SettingsStackParamList,
  'CurrencySelection'
>;
