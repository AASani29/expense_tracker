import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useApp } from "../context/AppContext";
import { CURRENCIES } from "../services/SettingsService";
import { getTheme } from "../utils/themes";

interface CurrencySelectionScreenProps {
  navigation: any;
}

interface CurrencyItem {
  code: string;
  symbol: string;
  name: string;
}

const CurrencySelectionScreen: React.FC<CurrencySelectionScreenProps> = ({
  navigation,
}) => {
  const { settings, updateSettings } = useApp();
  const [selectedCurrency, setSelectedCurrency] = useState(settings.currency);
  const [loading, setLoading] = useState(false);
  const theme = getTheme(settings.theme);

  const handleCurrencySelect = async (currency: CurrencyItem) => {
    try {
      setLoading(true);
      setSelectedCurrency(currency.code);

      await updateSettings({ currency: currency.code });

      Alert.alert(
        "Success",
        `Currency changed to ${currency.name} (${currency.symbol})`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update currency");
      setSelectedCurrency(settings.currency); // Reset to previous value
    } finally {
      setLoading(false);
    }
  };

  const renderCurrencyItem = ({ item }: { item: CurrencyItem }) => {
    const isSelected = item.code === selectedCurrency;

    return (
      <TouchableOpacity
        style={[
          styles.currencyItem,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isSelected ? "#007AFF" : theme.border,
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleCurrencySelect(item)}
        disabled={loading}
      >
        <View style={styles.currencyInfo}>
          <Text style={[styles.currencySymbol, { color: theme.text }]}>
            {item.symbol}
          </Text>
          <View style={styles.currencyDetails}>
            <Text style={[styles.currencyCode, { color: theme.text }]}>
              {item.code}
            </Text>
            <Text style={[styles.currencyName, { color: theme.textSecondary }]}>
              {item.name}
            </Text>
          </View>
        </View>
        {isSelected && (
          <AntDesign name="checkcircle" size={24} color="#007AFF" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Select Currency
        </Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Choose your preferred currency for displaying amounts
        </Text>

        <FlatList
          data={CURRENCIES}
          renderItem={renderCurrencyItem}
          keyExtractor={(item) => item.code}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 34, // Same width as back button
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  listContainer: {
    paddingBottom: 20,
  },
  currencyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currencyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "bold",
    width: 40,
    textAlign: "center",
    marginRight: 16,
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
  },
});

export default CurrencySelectionScreen;
