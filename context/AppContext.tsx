import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { databaseService, Expense } from "../services/DatabaseService";
import { settingsService, AppSettings } from "../services/SettingsService";

interface AppContextType {
  expenses: Expense[];
  settings: AppSettings;
  loading: boolean;
  refreshExpenses: () => Promise<void>;
  addExpense: (expense: Omit<Expense, "id" | "created_at">) => Promise<void>;
  updateExpense: (
    id: number,
    expense: Omit<Expense, "id" | "created_at">
  ) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  searchExpenses: (query: string) => Promise<Expense[]>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  isAuthenticated: boolean;
  authenticate: () => Promise<boolean>;
  logout: () => void;
  resetDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    currency: "USD",
    defaultCategory: "Other",
    theme: "light",
    biometricEnabled: false,
    pinEnabled: false,
    budgetEnabled: false,
    monthlyBudget: 1000,
    notificationsEnabled: true,
    budgetAlertPercentage: 80,
  });
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize app
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setLoading(true);

      // Initialize database
      try {
        await databaseService.initializeDatabase();
      } catch (dbError) {
        console.log("Database initialization failed, attempting reset...");
        await databaseService.resetDatabase();
      }

      // Load settings
      const appSettings = await settingsService.getSettings();
      setSettings(appSettings);

      // Check authentication requirements
      if (appSettings.pinEnabled || appSettings.biometricEnabled) {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        // Load expenses only if authenticated
        await loadExpenses();
      }
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenses = async () => {
    try {
      const expenseList = await databaseService.getAllExpenses();
      setExpenses(expenseList);
    } catch (error) {
      console.error("Error loading expenses:", error);
      // If there's a schema error, try to reset the database
      if (
        error instanceof Error &&
        error.message.includes("no such column: created_at")
      ) {
        console.log("Database schema issue detected, attempting to reset...");
        try {
          await databaseService.resetDatabase();
          const expenseList = await databaseService.getAllExpenses();
          setExpenses(expenseList);
          console.log("Database reset successfully");
        } catch (resetError) {
          console.error("Error resetting database:", resetError);
        }
      }
    }
  };

  const refreshExpenses = async () => {
    await loadExpenses();
  };

  const addExpense = async (expense: Omit<Expense, "id" | "created_at">) => {
    try {
      console.log("Adding expense from context:", expense);
      await databaseService.addExpense(expense);
      await refreshExpenses();

      // Check budget after adding expense
      await checkBudgetAlert();
      console.log("Expense added successfully");
    } catch (error) {
      console.error("Error adding expense:", error);

      // Try to reinitialize database if there's an error
      try {
        console.log("Attempting to reinitialize database...");
        await databaseService.resetDatabase();
        await databaseService.addExpense(expense);
        await refreshExpenses();
        console.log("Expense added successfully after database reset");
      } catch (retryError) {
        console.error(
          "Failed to add expense even after database reset:",
          retryError
        );
        throw retryError;
      }
    }
  };

  const checkBudgetAlert = async () => {
    try {
      if (!settings.budgetEnabled || !settings.notificationsEnabled) return;

      // Get current month's expenses
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      const monthlyExpenses = await databaseService.getExpensesByDateRange(
        startOfMonth,
        endOfMonth
      );
      const totalSpent = monthlyExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const { percentage } = await settingsService.getBudgetProgress(
        totalSpent
      );

      // Budget alert logic removed - notifications disabled
      console.log(
        `Budget usage: ${percentage}% (${totalSpent}/${settings.monthlyBudget})`
      );
    } catch (error) {
      console.error("Error checking budget alert:", error);
    }
  };

  const updateExpense = async (
    id: number,
    expense: Omit<Expense, "id" | "created_at">
  ) => {
    try {
      await databaseService.updateExpense(id, expense);
      await refreshExpenses();
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  };

  const deleteExpense = async (id: number) => {
    try {
      await databaseService.deleteExpense(id);
      await refreshExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  };

  const searchExpenses = async (query: string): Promise<Expense[]> => {
    try {
      return await databaseService.searchExpenses(query);
    } catch (error) {
      console.error("Error searching expenses:", error);
      return [];
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      await settingsService.updateSettings(newSettings);
      const updatedSettings = await settingsService.getSettings();
      setSettings(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  const authenticate = async (): Promise<boolean> => {
    try {
      const settings = await settingsService.getSettings();

      // If both PIN and biometric are disabled, allow immediate access
      if (!settings.pinEnabled && !settings.biometricEnabled) {
        setIsAuthenticated(true);
        await loadExpenses();
        return true;
      }

      // If biometric is enabled and available, try biometric first
      if (settings.biometricEnabled) {
        const { isAvailable } = await settingsService.isBiometricAvailable();
        if (isAvailable) {
          const biometricSuccess =
            await settingsService.authenticateWithBiometric();
          if (biometricSuccess) {
            setIsAuthenticated(true);
            await loadExpenses();
            return true;
          }
        }
      }

      // If PIN is enabled, the AuthenticationScreen will handle PIN entry
      if (settings.pinEnabled) {
        // This will be called after PIN verification in AuthenticationScreen
        setIsAuthenticated(true);
        await loadExpenses();
        return true;
      }

      return false;
    } catch (error) {
      console.error("Authentication error:", error);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setExpenses([]);
  };

  const resetDatabase = async () => {
    try {
      await databaseService.resetDatabase();
      await refreshExpenses();
    } catch (error) {
      console.error("Error resetting database:", error);
      throw error;
    }
  };

  const value: AppContextType = {
    expenses,
    settings,
    loading,
    refreshExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    searchExpenses,
    updateSettings,
    isAuthenticated,
    authenticate,
    logout,
    resetDatabase,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
