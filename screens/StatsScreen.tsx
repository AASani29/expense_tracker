import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useApp } from "../context/AppContext";
import { databaseService, ExpenseStats } from "../services/DatabaseService";
import { settingsService } from "../services/SettingsService";
import { getTheme } from "../utils/themes";

const { width } = Dimensions.get("window");

export default function StatsScreen() {
  const { expenses, settings } = useApp();
  const theme = getTheme(settings.theme);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("month");

  useEffect(() => {
    loadStats();
  }, [expenses]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const expenseStats = await databaseService.getExpenseStats();
      setStats(expenseStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return settingsService.formatAmount(amount, settings.currency);
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      Food: "#FF6B6B",
      Transportation: "#4ECDC4",
      Entertainment: "#45B7D1",
      Shopping: "#96CEB4",
      Bills: "#FFEAA7",
      Healthcare: "#DDA0DD",
      Education: "#98D8C8",
      Other: "#F7DC6F",
    };
    return colorMap[category] || "#F7DC6F";
  };

  const getTopCategories = () => {
    if (!stats) return [];

    return Object.entries(stats.categorySums)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  };

  const getRecentTrends = () => {
    if (!stats) return [];

    return stats.monthlyData.slice(0, 6);
  };

  const calculatePercentage = (amount: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((amount / total) * 100);
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
          Loading statistics...
        </Text>
      </View>
    );
  }

  if (!stats || stats.totalExpenses === 0) {
    return (
      <View
        style={[
          styles.container,
          styles.centerContent,
          { backgroundColor: theme.background },
        ]}
      >
        <AntDesign name="piechart" size={64} color={theme.textSecondary} />
        <Text style={[styles.emptyTitle, { color: theme.text }]}>
          No Data Available
        </Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          Add some expenses to see your statistics
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={styles.content}>
        <Text style={[styles.header, { color: theme.text }]}>Statistics</Text>

        {/* Total Overview */}
        <View
          style={[
            styles.overviewCard,
            {
              backgroundColor: theme.accent,
              borderColor: theme.border,
              shadowColor: settings.theme === "dark" ? "transparent" : "#000",
            },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: "rgba(255, 255, 255, 0.9)" }]}
          >
            Total Spending
          </Text>
          <Text style={[styles.totalAmount, { color: "white" }]}>
            {formatAmount(stats.totalExpenses)}
          </Text>
          <Text
            style={[styles.totalCount, { color: "rgba(255, 255, 255, 0.8)" }]}
          >
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Category Breakdown */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              shadowColor: settings.theme === "dark" ? "transparent" : "#000",
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Spending by Category
          </Text>
          {getTopCategories().map(([category, amount], index) => {
            const percentage = calculatePercentage(amount, stats.totalExpenses);
            return (
              <View
                key={category}
                style={[
                  styles.categoryItem,
                  { borderBottomColor: theme.border },
                ]}
              >
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: getCategoryColor(category) },
                    ]}
                  />
                  <Text style={[styles.categoryName, { color: theme.text }]}>
                    {category}
                  </Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={[styles.categoryAmount, { color: theme.text }]}>
                    {formatAmount(amount)}
                  </Text>
                  <Text
                    style={[
                      styles.categoryPercentage,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {percentage}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Monthly Trends */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              shadowColor: settings.theme === "dark" ? "transparent" : "#000",
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.text }]}>
            Recent Months
          </Text>
          {getRecentTrends().map((monthData, index) => {
            const monthName = new Date(
              monthData.month + "-01"
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            });
            const maxAmount = Math.max(
              ...stats.monthlyData.map((m) => m.total)
            );
            const percentage = calculatePercentage(monthData.total, maxAmount);

            return (
              <View key={monthData.month} style={styles.monthItem}>
                <View style={styles.monthInfo}>
                  <Text style={[styles.monthName, { color: theme.text }]}>
                    {monthName}
                  </Text>
                  <Text style={[styles.monthAmount, { color: theme.accent }]}>
                    {formatAmount(monthData.total)}
                  </Text>
                </View>
                <View
                  style={[styles.monthBar, { backgroundColor: theme.border }]}
                >
                  <View
                    style={[
                      styles.monthBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: theme.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                shadowColor: settings.theme === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            <AntDesign name="calculator" size={24} color={theme.accent} />
            <Text style={[styles.quickStatValue, { color: theme.text }]}>
              {formatAmount(stats.totalExpenses / expenses.length)}
            </Text>
            <Text
              style={[styles.quickStatLabel, { color: theme.textSecondary }]}
            >
              Average per Expense
            </Text>
          </View>

          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                shadowColor: settings.theme === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            <AntDesign name="tags" size={24} color="#FF6B6B" />
            <Text style={[styles.quickStatValue, { color: theme.text }]}>
              {Object.keys(stats.categorySums).length}
            </Text>
            <Text
              style={[styles.quickStatLabel, { color: theme.textSecondary }]}
            >
              Categories Used
            </Text>
          </View>
        </View>

        {/* Top Category */}
        {getTopCategories().length > 0 && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
                shadowColor: settings.theme === "dark" ? "transparent" : "#000",
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Top Spending Category
            </Text>
            <View style={styles.topCategoryContainer}>
              <View
                style={[
                  styles.topCategoryIcon,
                  {
                    backgroundColor: getCategoryColor(getTopCategories()[0][0]),
                  },
                ]}
              >
                <AntDesign name="star" size={24} color="white" />
              </View>
              <View style={styles.topCategoryInfo}>
                <Text style={[styles.topCategoryName, { color: theme.text }]}>
                  {getTopCategories()[0][0]}
                </Text>
                <Text
                  style={[styles.topCategoryAmount, { color: theme.accent }]}
                >
                  {formatAmount(getTopCategories()[0][1])}
                </Text>
                <Text
                  style={[
                    styles.topCategoryPercentage,
                    { color: theme.textSecondary },
                  ]}
                >
                  {calculatePercentage(
                    getTopCategories()[0][1],
                    stats.totalExpenses
                  )}
                  % of total spending
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: Math.max(16, width * 0.04), // Responsive padding: 4% of screen width, minimum 16
    paddingTop: Constants.statusBarHeight + Math.max(20, width * 0.05),
  },
  header: {
    fontSize: Math.max(28, width * 0.08), // Responsive: 8% of screen width, minimum 28
    fontWeight: "800",
    marginBottom: Math.max(20, width * 0.06),
    textAlign: "center",
    letterSpacing: -0.5,
  },
  overviewCard: {
    padding: Math.max(24, width * 0.08), // Responsive padding
    borderRadius: Math.max(20, width * 0.06),
    alignItems: "center",
    marginBottom: Math.max(20, width * 0.05),
    borderWidth: 0,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    padding: Math.max(20, width * 0.05), // Responsive padding
    borderRadius: Math.max(16, width * 0.04),
    marginBottom: Math.max(16, width * 0.04),
    borderWidth: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: Math.max(18, width * 0.045), // Responsive font size
    fontWeight: "700",
    marginBottom: Math.max(16, width * 0.04),
    letterSpacing: 0.3,
  },
  totalAmount: {
    fontSize: Math.max(32, width * 0.09), // Large responsive font
    fontWeight: "900",
    marginBottom: Math.max(6, width * 0.015),
    letterSpacing: -1,
  },
  totalCount: {
    fontSize: Math.max(14, width * 0.035),
    fontWeight: "500",
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Math.max(12, width * 0.03),
    borderBottomWidth: 0.5,
    marginBottom: 2,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryDot: {
    width: Math.max(10, width * 0.025),
    height: Math.max(10, width * 0.025),
    borderRadius: Math.max(5, width * 0.0125),
    marginRight: Math.max(12, width * 0.03),
  },
  categoryName: {
    fontSize: Math.max(15, width * 0.04),
    flex: 1,
    fontWeight: "500",
  },
  categoryStats: {
    alignItems: "flex-end",
    minWidth: width * 0.2, // Ensure consistent width for amounts
  },
  categoryAmount: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: Math.max(12, width * 0.03),
    fontWeight: "500",
  },
  monthItem: {
    marginBottom: Math.max(14, width * 0.035),
  },
  monthInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Math.max(8, width * 0.02),
  },
  monthName: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "500",
    flex: 1,
  },
  monthAmount: {
    fontSize: Math.max(15, width * 0.04),
    fontWeight: "700",
  },
  monthBar: {
    height: Math.max(6, width * 0.015),
    borderRadius: Math.max(3, width * 0.0075),
    overflow: "hidden",
  },
  monthBarFill: {
    height: "100%",
    borderRadius: Math.max(3, width * 0.0075),
  },
  quickStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Math.max(16, width * 0.04),
    gap: Math.max(12, width * 0.03), // Add gap for better spacing
  },
  quickStatCard: {
    flex: 1,
    maxWidth:
      (width - Math.max(32, width * 0.08) - Math.max(12, width * 0.03)) / 2, // Responsive max width
    padding: Math.max(18, width * 0.045),
    borderRadius: Math.max(16, width * 0.04),
    alignItems: "center",
    borderWidth: 0,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    minHeight: Math.max(100, width * 0.25), // Consistent height
  },
  quickStatValue: {
    fontSize: Math.max(18, width * 0.045),
    fontWeight: "800",
    marginVertical: Math.max(8, width * 0.02),
    textAlign: "center",
  },
  quickStatLabel: {
    fontSize: Math.max(12, width * 0.03),
    textAlign: "center",
    fontWeight: "500",
    lineHeight: Math.max(16, width * 0.04),
  },
  topCategoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Math.max(8, width * 0.02),
  },
  topCategoryIcon: {
    width: Math.max(48, width * 0.12),
    height: Math.max(48, width * 0.12),
    borderRadius: Math.max(24, width * 0.06),
    justifyContent: "center",
    alignItems: "center",
    marginRight: Math.max(16, width * 0.04),
  },
  topCategoryInfo: {
    flex: 1,
  },
  topCategoryName: {
    fontSize: Math.max(18, width * 0.045),
    fontWeight: "700",
    marginBottom: Math.max(4, width * 0.01),
  },
  topCategoryAmount: {
    fontSize: Math.max(16, width * 0.04),
    fontWeight: "700",
    marginBottom: Math.max(2, width * 0.005),
  },
  topCategoryPercentage: {
    fontSize: Math.max(13, width * 0.032),
    fontWeight: "500",
  },
  emptyTitle: {
    fontSize: Math.max(20, width * 0.05),
    fontWeight: "700",
    marginTop: Math.max(16, width * 0.04),
    marginBottom: Math.max(8, width * 0.02),
  },
  emptySubtitle: {
    fontSize: Math.max(15, width * 0.04),
    textAlign: "center",
    paddingHorizontal: Math.max(32, width * 0.08),
    lineHeight: Math.max(22, width * 0.055),
  },
  loadingText: {
    marginTop: Math.max(12, width * 0.03),
    fontSize: Math.max(15, width * 0.04),
  },
});
