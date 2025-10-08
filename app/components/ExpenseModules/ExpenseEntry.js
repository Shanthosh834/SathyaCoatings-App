import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Dimensions,
  SafeAreaView,
} from "react-native";
import axios from "axios";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { MaterialIcons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Get screen dimensions for responsive design
const { width } = Dimensions.get('window');

// API Configuration
const API_CONFIG = {
  BASE_URL: "http://10.140.205.28:5000",
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ API Error:`, error);
    return Promise.reject(error);
  }
);

// Error handler utility
const handleApiError = (error, context = '') => {
  let userMessage = `Failed to ${context.toLowerCase()}`;
  
  switch (error.response?.status) {
    case 400:
      userMessage = error.response?.data?.message || 'Invalid request data';
      break;
    case 401:
      userMessage = 'Authentication required';
      break;
    case 403:
      userMessage = 'Access forbidden';
      break;
    case 404:
      userMessage = 'Resource not found';
      break;
    case 422:
      userMessage = 'Validation failed';
      break;
    case 429:
      userMessage = 'Too many requests - please wait';
      break;
    case 500:
      userMessage = 'Server error - please try again';
      break;
    case 502:
    case 503:
    case 504:
      userMessage = 'Service unavailable - please try later';
      break;
    default:
      if (error.code === 'ECONNABORTED') {
        userMessage = 'Request timeout - check connection';
      } else if (error.message === 'Network Error') {
        userMessage = 'Network error - check connectivity';
      }
  }

  return userMessage;
};

// Product Card Component (shows product name with Usage button)
const ProductCard = ({ budget, onUsagePress }) => {
  if (budget.overhead_id === 1 || budget.overhead_id === 2) {
    return null;
  }

  return (
    <View style={styles.productCard}>
      <View style={styles.productCardHeader}>
        <Text style={styles.productCardTitle}>{budget.expense_name}</Text>
      </View>
      
      <View style={styles.productCardIcon}>
        {/* <Ionicons name="document-text-outline" size={40} color="#0891b2" /> */}
        {/* Rupee Note Icon */}
        <MaterialCommunityIcons name="currency-inr" size={36} color="#2E7D32" />
      
      </View>
      
      <TouchableOpacity
        onPress={() => onUsagePress(budget)}
        style={styles.usageButton}
      >
        <Ionicons name="create-outline" size={18} color="#fff" style={styles.usageIcon} />
        <Text style={styles.usageButtonText}>Usage</Text>
      </TouchableOpacity>
    </View>
  );
};

// Budget Detail Card Component (shows detailed budget info with inputs)
const BudgetDetailCard = ({ budget, expenseDetails, expenseInputs, handleInputChange, handleSave, selectedDate, submitting, onBack }) => {
  const displayData = expenseDetails[budget.id] || {
    cumulative: { actual_value: parseFloat(budget.actual_value) || 0 },
    entries: [
      {
        id: budget.id,
        actual_value: parseFloat(budget.actual_value) || 0,
        remarks: budget.remarks || "No remarks",
        created_at: `${selectedDate}T10:06:00`
      }
    ]
  };

  const splittedBudget = parseFloat(budget.splitted_budget) || 0;
  const cumulativeValue = parseFloat(displayData.cumulative.actual_value) || 0;

  const getStatus = () => {
    if (cumulativeValue > splittedBudget) {
      return { text: 'Exceeded', color: '#dc2626', bgColor: 'rgba(220, 38, 38, 0.1)' };
    } else if (Math.abs(cumulativeValue - splittedBudget) < 0.01) {
      return { text: 'Completed', color: '#16a34a', bgColor: 'rgba(22, 163, 74, 0.1)' };
    } else {
      return { text: 'In Progress', color: '#2563eb', bgColor: 'rgba(37, 99, 235, 0.1)' };
    }
  };

  const status = getStatus();

  return (
    <View style={styles.budgetDetailCard}>
      <View style={styles.budgetDetailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0891b2" />
        </TouchableOpacity>
        <Text style={styles.budgetDetailTitle}>{budget.expense_name}</Text>
      </View>
      
      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Splitted Budget</Text>
        <Text style={styles.budgetCardValue}>₹{splittedBudget.toFixed(2)}</Text>
      </View>

      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Progress as of {selectedDate}</Text>
        <Text style={styles.budgetCardValue}>Actual: ₹{cumulativeValue.toFixed(2)} / ₹{splittedBudget.toFixed(2)}</Text>
      </View>

      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
          {status.text === 'Completed' && (
            <Ionicons name="checkmark-circle" size={16} color={status.color} style={styles.statusIcon} />
          )}
        </View>
      </View>

      <View style={styles.budgetCardSection}>
        <Text style={styles.budgetCardLabel}>Entries on {selectedDate}</Text>
        {displayData.entries.length === 0 ? (
          <Text style={styles.noEntriesText}>No entries</Text>
        ) : (
          displayData.entries.map((entry) => (
            <View key={entry.id} style={styles.entryItem}>
              <Text style={styles.entryText}>
                At {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:
                {' '}Actual: ₹{(parseFloat(entry.actual_value) || 0).toFixed(2)} ({entry.remarks})
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.inputSection}>
        <Text style={styles.inputLabel}>Actual Value</Text>
        <TextInput
          style={styles.input}
          placeholder="Expense Value"
          value={expenseInputs[budget.id]?.actual_value || ""}
          onChangeText={(val) => handleInputChange(budget.id, 'actual_value', val)}
          keyboardType="numeric"
        />
        
        <Text style={styles.inputLabel}>Remarks</Text>
        <TextInput
          style={styles.input}
          placeholder="Remarks"
          value={expenseInputs[budget.id]?.remarks || ""}
          onChangeText={(val) => handleInputChange(budget.id, 'remarks', val)}
        />
        
        <TouchableOpacity
          onPress={() => handleSave(budget.id)}
          style={[
            styles.saveButton,
            (submitting || !expenseInputs[budget.id] || 
             Object.values(expenseInputs[budget.id] || {}).every(val => val === "" || val === null)) && 
            styles.saveButtonDisabled
          ]}
          disabled={
            submitting ||
            !expenseInputs[budget.id] ||
            Object.values(expenseInputs[budget.id] || {}).every(val => val === "" || val === null)
          }
        >
          <Ionicons name="save-outline" size={16} color="white" style={styles.saveIcon} />
          <Text style={styles.saveButtonText}>Save Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Selection Info Header Component
const SelectionInfoHeader = ({ selection }) => (
  <View className="px-4 py-2 mx-4 mb-4 bg-white border border-gray-400 rounded-lg">
    <View className="flex-row flex-wrap">
      {/* Company */}
      <View className="w-1/2 pr-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          COMPANY
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.company?.company_name || "—"}
        </Text>
      </View>

      {/* Project */}
      <View className="w-1/2 pl-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          PROJECT
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.project?.project_name || "—"}
        </Text>
      </View>

      {/* Site */}
      <View className="w-1/2 pr-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          SITE
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.site?.site_name || "—"}
        </Text>
      </View>

      {/* Work */}
      <View className="w-1/2 pl-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          WORK
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.workDesc?.desc_name || "—"}
        </Text>
      </View>
    </View>
  </View>
);

export default function BudgetExpenseEntry() {
  const route = useRoute();
  const { selection, encodedUserId } = route.params || {};

  const [state, setState] = useState({
    budgetData: [],
    filteredBudget: [],
    loading: false,
    refreshing: false,
    submitting: false,
    selectedDate: new Date().toISOString().split('T')[0],
    expenseDetails: {},
    selectedProduct: null,
    showProductCards: true,
  });

  const [expenseInputs, setExpenseInputs] = useState({});

  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  const apiService = useMemo(() => ({
    async fetchBudgetDetails(siteId) {
      const response = await apiClient.get(`/site-incharge/budget-details?site_id=${siteId}`);
      return response.data?.data || [];
    },

    async fetchExpenseDetails(budgetId, date) {
      const response = await apiClient.get(
        `/site-incharge/budget-expense-details?actual_budget_id=${budgetId}&date=${date}`
      );
      return response.data?.data || {};
    },

    async saveBudgetExpense(payload) {
      const response = await apiClient.post('/site-incharge/save-budget-expense', payload);
      return response.data;
    },
  }), []);

  // Call calculate-labour-budget API on component mount
  useEffect(() => {
    const callCalculateLabourBudget = async () => {
      try {
        await apiClient.get("/site-incharge/calculate-labour-budget");
        console.log("Labour budget calculation triggered");
      } catch (error) {
        console.error("Error calling calculate-labour-budget API:", error.message);
      }
    };
    
    callCalculateLabourBudget();
  }, []);

  // Fetch budget data when selection is available
  useEffect(() => {
    let isMounted = true;
    
    if (selection?.site?.site_id) {
      const fetchBudgetData = async () => {
        try {
          updateState({ loading: true });
          
          const budgetData = await apiService.fetchBudgetDetails(selection.site.site_id);
          
          if (isMounted) {
            // Filter budget data based on work description if available
            const filteredData = selection.workDesc 
              ? budgetData.filter(item => item.work_desc_id === selection.workDesc.work_desc_id)
              : budgetData;
              
            updateState({ 
              budgetData,
              filteredBudget: filteredData,
              expenseDetails: {},
            });
          }
        } catch (error) {
          if (isMounted) {
            const message = handleApiError(error, 'fetch budget data');
            Toast.show({ type: 'error', text1: message });
          }
        } finally {
          if (isMounted) {
            updateState({ loading: false });
          }
        }
      };
      fetchBudgetData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [selection, apiService, updateState]);

  // Fetch expense details when date or budget data changes
  useEffect(() => {
    if (state.selectedDate && state.filteredBudget.length > 0) {
      const fetchAllExpenseDetails = async () => {
        try {
          const expenseDetailsPromises = state.filteredBudget.map(budget => 
            apiService.fetchExpenseDetails(budget.id, state.selectedDate)
          );
          
          const expenseDetailsResults = await Promise.all(expenseDetailsPromises);
          const expenseDetailsMap = {};
          
          state.filteredBudget.forEach((budget, index) => {
            expenseDetailsMap[budget.id] = expenseDetailsResults[index];
          });
          
          updateState({ expenseDetails: expenseDetailsMap });
        } catch (error) {
          console.error("Error fetching expense details:", error);
        }
      };
      
      fetchAllExpenseDetails();
    }
  }, [state.selectedDate, state.filteredBudget, apiService, updateState]);

  const handleRefresh = useCallback(async () => {
    if (!selection?.site?.site_id) return;
    
    updateState({ refreshing: true });
    
    try {
      const budgetData = await apiService.fetchBudgetDetails(selection.site.site_id);
      
      const filteredData = selection.workDesc 
        ? budgetData.filter(item => item.work_desc_id === selection.workDesc.work_desc_id)
        : budgetData;
        
      updateState({ 
        budgetData,
        filteredBudget: filteredData,
      });
    } catch (error) {
      const message = handleApiError(error, 'refresh data');
      Toast.show({ type: 'error', text1: message });
    } finally {
      updateState({ refreshing: false });
    }
  }, [selection, apiService, updateState]);

  const handleInputChange = useCallback((budgetId, field, value) => {
    if (field === 'actual_value') {
      // Allow only numbers and decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const decimalCount = (numericValue.match(/\./g) || []).length;
      if (decimalCount > 1) return;
      
      setExpenseInputs(prevInputs => ({
        ...prevInputs,
        [budgetId]: { 
          ...prevInputs[budgetId], 
          [field]: numericValue 
        },
      }));
    } else {
      // Handle other fields normally
      setExpenseInputs(prevInputs => ({
        ...prevInputs,
        [budgetId]: { 
          ...prevInputs[budgetId], 
          [field]: value 
        },
      }));
    }
  }, []);

  const handleSave = useCallback(async (budgetId) => {
    const inputData = expenseInputs[budgetId];
    if (!inputData?.actual_value) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter an actual value',
      });
      return;
    }

    try {
      updateState({ submitting: true });
      
      // Decode user ID from the encoded parameter or use default
      let user_id = "1";
      try {
        if (encodedUserId) {
          user_id = atob(encodedUserId);
        }
      } catch (decodeError) {
        console.warn("Could not decode user ID, using default");
      }

      const payload = {
        actual_budget_id: budgetId,
        entry_date: state.selectedDate,
        actual_value: parseFloat(inputData.actual_value),
        remarks: inputData.remarks || '',
        created_by: parseInt(user_id)
      };

      await apiService.saveBudgetExpense(payload);
      
      // Refresh expense details after saving
      const expenseDetail = await apiService.fetchExpenseDetails(budgetId, state.selectedDate);
      updateState(prevState => ({
        ...prevState,
        expenseDetails: {
          ...prevState.expenseDetails,
          [budgetId]: expenseDetail
        }
      }));
      
      setExpenseInputs(prevInputs => {
        const newInputs = { ...prevInputs };
        delete newInputs[budgetId];
        return newInputs;
      });
      
      Toast.show({ 
        type: 'success', 
        text1: 'Expense saved successfully!',
        text2: 'Budget has been updated'
      });
    } catch (error) {
      const message = handleApiError(error, 'save expense');
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: message,
      });
    } finally {
      updateState({ submitting: false });
    }
  }, [expenseInputs, state.selectedDate, apiService, updateState, encodedUserId]);

  // Handle product usage button press
  const handleUsagePress = useCallback((budget) => {
    updateState({ 
      selectedProduct: budget, 
      showProductCards: false 
    });
  }, [updateState]);

  // Handle back from detail view
  const handleBackToProducts = useCallback(() => {
    updateState({ 
      selectedProduct: null, 
      showProductCards: true 
    });
  }, [updateState]);

  const renderCards = () => {
    if (state.loading && !state.refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0f766e" />
          <Text style={styles.loadingText}>Loading budget data...</Text>
        </View>
      );
    }

    // Show consumables data if selection is complete
    if (selection?.site?.site_id) {
      // Show detail view for selected product
      if (!state.showProductCards && state.selectedProduct) {
        return (
          <View style={styles.cardsContainer}>
            <BudgetDetailCard
              budget={state.selectedProduct}
              expenseDetails={state.expenseDetails}
              expenseInputs={expenseInputs}
              handleInputChange={handleInputChange}
              handleSave={handleSave}
              selectedDate={state.selectedDate}
              submitting={state.submitting}
              onBack={handleBackToProducts}
            />
          </View>
        );
      }

      // Show product cards grid
      const consumablesBudgets = state.filteredBudget.filter(budget => budget.overhead_id !== 1 && budget.overhead_id !== 2);
      
      return (
        <View style={styles.cardsContainer}>
          <View style={styles.productGrid}>
            {consumablesBudgets.map((budget) => (
              <ProductCard
                key={budget.id}
                budget={budget}
                onUsagePress={handleUsagePress}
              />
            ))}
          </View>
          
          {consumablesBudgets.length === 0 && (
            <View style={styles.emptyCategory}>
              <Text style={styles.emptyCategoryText}>No consumables data available</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>
          No selection data available. Please go back and make selections.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl 
            refreshing={state.refreshing} 
            onRefresh={handleRefresh}
            enabled={!!selection?.site?.site_id}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Selection Info Header */}
        <SelectionInfoHeader selection={selection} />

        <View style={styles.budgetContainer}>
          {renderCards()}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  budgetContainer: {
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '400',
  },
  cardsContainer: {
    flexDirection: 'column',
  },
  emptyCategory: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  productCard: {
    width: '48%',
        marginBottom: 20,
        marginHorizontal: '1%',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        shadowColor: '#6366f1',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 0.5,
        borderColor: '#333',
        overflow: 'hidden'
  },
  productCardHeader: {
    paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#f8fafc',
      position: 'relative',
      height: 48,
      borderBottomWidth: 1,
      borderColor: "#ccc",
      // shadowColor: '#000',
      // shadowOffset: {
      //   width: 0,
      //   height: 2,
      // },
      // shadowOpacity: 0.1,
      // shadowRadius: 3,
      elevation: 1,
  },
  productCardTitle: {
    fontWeight: '900',
        textAlign: 'center',
        color: '#1f2937',
        fontSize: 12,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        
  },
  productCardIcon: {
    alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 16,
        // backgroundColor: 'white',
        marginHorizontal: 8,
        marginTop: 8,
        borderRadius: 16
  },
  usageButton: {
     paddingVertical: 10,
    borderRadius: 8,
    // backgroundColor: "#1e7a6f",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#16786f",
    margin: 8
  },
  usageIcon: {
    marginRight: 6,
  },
  usageButtonText: {
     fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
      color: "#fff"
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  budgetDetailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  budgetDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  budgetDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  budgetCardSection: {
    marginBottom: 12,
  },
  budgetCardLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  budgetCardValue: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusIcon: {
    marginLeft: 4,
  },
  noEntriesText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  entryItem: {
    marginBottom: 4,
  },
  entryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  inputSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'white',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});