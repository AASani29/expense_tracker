import * as SQLite from 'expo-sqlite';

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  description?: string;
  created_at?: string;
}

export interface ExpenseStats {
  totalExpenses: number;
  categorySums: { [category: string]: number };
  monthlyData: { month: string; total: number }[];
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      console.log('Initializing database with sync API...');
      
      // Use the sync API for better compatibility in Expo Go
      this.db = SQLite.openDatabaseSync('expenses.db');
      console.log('Database opened successfully');
      
      // Create the expenses table with all required columns
      this.db.execSync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT (datetime('now','localtime'))
        );
      `);
      
      console.log('Table created/verified successfully');
      
      // Check if created_at column exists and add it if it doesn't
      try {
        const result = this.db.getFirstSync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='expenses'"
        );
        if (result) {
          // Check if created_at column exists
          const columns = this.db.getAllSync("PRAGMA table_info(expenses)");
          const hasCreatedAt = columns.some((col: any) => col.name === 'created_at');
          
          if (!hasCreatedAt) {
            console.log('Adding created_at column...');
            this.db.execSync(`
              ALTER TABLE expenses ADD COLUMN created_at DATETIME DEFAULT (datetime('now','localtime'));
            `);
            console.log('created_at column added');
          }
        }
      } catch (error) {
        console.log('created_at column already exists or error checking:', error);
      }
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private ensureCreatedAtColumn(): void {
    if (!this.db) return;
    
    try {
      // Check if created_at column exists
      const tableInfo = this.db.getAllSync(
        "PRAGMA table_info(expenses)"
      ) as { name: string }[];
      
      const hasCreatedAt = tableInfo.some(column => column.name === 'created_at');
      
      if (!hasCreatedAt) {
        console.log('Adding created_at column to expenses table');
        
        // Add column without default value first
        this.db.execSync(`
          ALTER TABLE expenses ADD COLUMN created_at DATETIME;
        `);
        
        // Update existing records to have created_at values using datetime('now')
        this.db.execSync(`
          UPDATE expenses SET created_at = datetime('now') WHERE created_at IS NULL;
        `);
        
        console.log('Created_at column added successfully');
      }
    } catch (error) {
      console.error('Error ensuring created_at column:', error);
      // If column addition fails, try a complete table recreation as fallback
      try {
        console.log('Attempting table recreation...');
        this.recreateTableWithCreatedAt();
      } catch (recreateError) {
        console.error('Error recreating table:', recreateError);
        // Don't throw here as this is a migration step
      }
    }
  }

  private recreateTableWithCreatedAt(): void {
    if (!this.db) return;
    
    // Backup existing data
    const existingData = this.db.getAllSync('SELECT * FROM expenses') as any[];
    
    // Drop and recreate table
    this.db.execSync('DROP TABLE IF EXISTS expenses_backup');
    this.db.execSync(`
      CREATE TABLE expenses_backup AS SELECT * FROM expenses;
    `);
    
    this.db.execSync('DROP TABLE expenses');
    this.db.execSync(`
      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT (datetime('now'))
      );
    `);
    
    // Restore data with created_at
    if (existingData.length > 0) {
      for (const expense of existingData) {
        this.db.runSync(`
          INSERT INTO expenses (id, title, amount, category, date, description, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          expense.id,
          expense.title,
          expense.amount,
          expense.category,
          expense.date,
          expense.description || '',
          expense.created_at || new Date().toISOString()
        ]);
      }
    }
    
    // Clean up backup
    this.db.execSync('DROP TABLE IF EXISTS expenses_backup');
    console.log('Table recreated successfully with created_at column');
  }

  addExpense(expense: Omit<Expense, 'id' | 'created_at'>): number {
    if (!this.db) {
      console.error('Database not initialized, attempting to reinitialize...');
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }

    try {
      console.log('Adding expense:', expense);
      const result = this.db.runSync(
        'INSERT INTO expenses (title, amount, category, date, description) VALUES (?, ?, ?, ?, ?)',
        [expense.title, expense.amount, expense.category, expense.date, expense.description || '']
      );
      
      console.log('Expense added successfully with ID:', result.lastInsertRowId);
      return result.lastInsertRowId as number;
    } catch (error) {
      console.error('Error adding expense:', error);
      console.error('Expense data:', expense);
      throw error;
    }
  }

  getAllExpenses(): Expense[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = this.db.getAllSync(
        'SELECT * FROM expenses ORDER BY date DESC, id DESC'
      );
      
      return result as Expense[];
    } catch (error) {
      console.error('Error fetching expenses:', error);
      throw error;
    }
  }

  getExpenseById(id: number): Expense | null {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = this.db.getFirstSync(
        'SELECT * FROM expenses WHERE id = ?',
        [id]
      );
      
      return result as Expense | null;
    } catch (error) {
      console.error('Error fetching expense by id:', error);
      throw error;
    }
  }

  updateExpense(id: number, expense: Omit<Expense, 'id' | 'created_at'>): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.runSync(
        'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ?, description = ? WHERE id = ?',
        [expense.title, expense.amount, expense.category, expense.date, expense.description || '', id]
      );
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  deleteExpense(id: number): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.runSync('DELETE FROM expenses WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  searchExpenses(query: string): Expense[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = this.db.getAllSync(
        'SELECT * FROM expenses WHERE title LIKE ? OR description LIKE ? OR category LIKE ? ORDER BY date DESC',
        [`%${query}%`, `%${query}%`, `%${query}%`]
      );
      
      return result as Expense[];
    } catch (error) {
      console.error('Error searching expenses:', error);
      throw error;
    }
  }

  getExpenseStats(): ExpenseStats {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Total expenses
      const totalResult = this.db.getFirstSync(
        'SELECT SUM(amount) as total FROM expenses'
      ) as { total: number };

      // Category sums
      const categoryResult = this.db.getAllSync(
        'SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC'
      ) as { category: string; total: number }[];

      // Monthly data
      const monthlyResult = this.db.getAllSync(
        `SELECT 
          strftime('%Y-%m', date) as month,
          SUM(amount) as total 
         FROM expenses 
         GROUP BY strftime('%Y-%m', date) 
         ORDER BY month DESC 
         LIMIT 12`
      ) as { month: string; total: number }[];

      const categorySums: { [category: string]: number } = {};
      categoryResult.forEach(item => {
        categorySums[item.category] = item.total;
      });

      return {
        totalExpenses: totalResult.total || 0,
        categorySums,
        monthlyData: monthlyResult
      };
    } catch (error) {
      console.error('Error fetching expense stats:', error);
      throw error;
    }
  }

  clearAllData(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      this.db.runSync('DELETE FROM expenses');
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  resetDatabase(): void {
    try {
      console.log('Resetting database...');
      
      if (this.db) {
        this.db.closeSync();
        this.db = null;
      }
      
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Error resetting database:', error);
      throw error;
    }
  }

  getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = this.db.getAllSync(
        'SELECT * FROM expenses WHERE date BETWEEN ? AND ? ORDER BY date DESC',
        [startDate, endDate]
      );
      
      return result as Expense[];
    } catch (error) {
      console.error('Error fetching expenses by date range:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();
