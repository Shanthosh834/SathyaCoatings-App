import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

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

apiClient.interceptors.response.use(
  (response) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ API Error:`, {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data,
    });

    if (error.config && !error.config.__isRetryRequest) {
      error.config.__isRetryRequest = true;
      
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        for (let i = 0; i < API_CONFIG.RETRY_ATTEMPTS; i++) {
          try {
            await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1)));
            console.log(`[${timestamp}] 🔄 Retrying request (${i + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
            return await apiClient.request(error.config);
          } catch (retryError) {
            if (i === API_CONFIG.RETRY_ATTEMPTS - 1) {
              console.error(`[${timestamp}] 💥 All retry attempts failed`);
            }
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

const handleApiError = (error, context = '') => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Error in ${context}:`, {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url,
  });

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

const apiService = {
  async fetchLabours() {
    const response = await apiClient.get('/site-incharge/labours');
    return response.data?.data || response.data || [];
  },

  async saveLabourAssignment(payload) {
    const response = await apiClient.post('/site-incharge/save-labour-assignment', payload);
    return response.data;
  },
};

export default function LabourAssign({ route }) {
  const { selection, encodedUserId } = route?.params || {};
  
  useEffect(() => {
    if (!selection || !selection.company || !selection.project || !selection.site || !selection.workDesc) {
      Toast.show({
        type: 'error',
        text1: 'Missing Selection Data',
        text2: 'Please select work details from the previous page',
      });
    }
  }, [selection]);

  const [state, setState] = useState({
    labours: [],
    selectedLabours: [],
    fromDate: new Date(),
    toDate: new Date(),
    showFromPicker: false,
    showToPicker: false,
    loading: false,
    submitting: false,
    refreshing: false,
    assignmentSaved: false,
  });

  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  useEffect(() => {
    const fetchLabours = async () => {
      try {
        updateState({ loading: true });
        const labours = await apiService.fetchLabours();
        console.log('Labours fetched:', labours);
        updateState({ labours });
      } catch (error) {
        const message = handleApiError(error, 'fetch labours');
        Toast.show({ type: 'error', text1: message });
      } finally {
        updateState({ loading: false });
      }
    };

    fetchLabours();
  }, [updateState]);

  const validateDates = useCallback(() => {
    if (state.toDate < state.fromDate) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Date Range',
        text2: 'End date must be after start date',
      });
      return false;
    }
    return true;
  }, [state.fromDate, state.toDate]);

  const validateAndDecodeUserId = useCallback(() => {
    if (!encodedUserId) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'User ID is missing',
      });
      return null;
    }

    try {
      const decodedUserId = atob(encodedUserId);
      if (decodedUserId === 'test' || /^\d+$/.test(decodedUserId)) {
        return decodedUserId === 'test' ? 1 : parseInt(decodedUserId, 10);
      }
      throw new Error('Invalid format');
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Invalid user credentials',
      });
      return null;
    }
  }, [encodedUserId]);

  const isFormValid = useMemo(() =>
    selection &&
    selection.company &&
    selection.project &&
    selection.site &&
    selection.workDesc &&
    Array.isArray(state.selectedLabours) &&
    state.selectedLabours.length > 0 &&
    state.fromDate &&
    state.toDate &&
    state.toDate >= state.fromDate
  , [selection, state.selectedLabours, state.fromDate, state.toDate]);

  const handleSaveAssignment = useCallback(async () => {
    if (!isFormValid) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Form',
        text2: 'Please fill all required fields',
      });
      return;
    }

    if (!validateDates()) return;

    const userId = validateAndDecodeUserId();
    if (!userId) return;

    const payload = {
      project_id: selection.project.project_id,
      site_id: selection.site.site_id,
      desc_id: selection.workDesc.desc_id,
      labour_ids: state.selectedLabours,
      from_date: state.fromDate.toISOString().split('T')[0],
      to_date: state.toDate.toISOString().split('T')[0],
      created_by: userId,
    };

    console.log('Sending payload:', payload);

    try {
      updateState({ submitting: true });
      
      const response = await apiService.saveLabourAssignment(payload);
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: response.message || 'Assignment saved successfully',
      });

      updateState({
        selectedLabours: [],
        assignmentSaved: true,
      });

    } catch (error) {
      const message = handleApiError(error, 'save assignment');
      console.error('Save assignment error:', error.response?.data);
      Toast.show({
        type: 'error',
        text1: 'Save Failed',
        text2: message,
      });
    } finally {
      updateState({ submitting: false });
    }
  }, [isFormValid, validateDates, validateAndDecodeUserId, selection, state, updateState]);

  const handleRefresh = useCallback(async () => {
    try {
      updateState({ refreshing: true });
      const labours = await apiService.fetchLabours();
      updateState({ labours });
    } catch (error) {
      const message = handleApiError(error, 'refresh data');
      Toast.show({ type: 'error', text1: message });
    } finally {
      updateState({ refreshing: false });
    }
  }, [updateState]);

  const addLabour = useCallback((labourId) => {
    if (!state.selectedLabours.includes(labourId)) {
      updateState({
        selectedLabours: [...state.selectedLabours, labourId],
        assignmentSaved: false,
      });
    }
  }, [state.selectedLabours, updateState]);

  const removeLabour = useCallback((labourId) => {
    updateState({
      selectedLabours: state.selectedLabours.filter(id => id !== labourId),
      assignmentSaved: false,
    });
  }, [state.selectedLabours, updateState]);

  const handleFromDateChange = useCallback((event, selectedDate) => {
    updateState({ showFromPicker: false });
    if (selectedDate) {
      const updates = { fromDate: selectedDate };
      if (selectedDate > state.toDate) {
        updates.toDate = selectedDate;
      }
      updateState(updates);
    }
  }, [state.toDate, updateState]);

  const handleToDateChange = useCallback((event, selectedDate) => {
    updateState({ showToPicker: false });
    if (selectedDate) {
      updateState({ toDate: selectedDate });
    }
  }, [updateState]);

  if (!selection || !selection.company || !selection.project || !selection.site || !selection.workDesc) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="warning" size={64} color="#f59e0b" />
        <Text style={styles.errorTitle}>Selection Required</Text>
        <Text style={styles.errorText}>
          Please go back and select your work details first
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={state.refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectionBox}>
          <View className="flex-row flex-wrap">
            <View className="w-1/2 mb-2 pr-2">
              <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                COMPANY
              </Text>
              <Text className="text-xs font-semibold text-gray-900">
                {selection.company?.company_name || "—"}
              </Text>
            </View>

            <View className="w-1/2 mb-2 pl-2">
              <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                PROJECT
              </Text>
              <Text className="text-xs font-semibold text-gray-900">
                {selection.project?.project_name || "—"}
              </Text>
            </View>

            <View className="w-1/2 pr-2">
              <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                SITE
              </Text>
              <Text className="text-xs font-semibold text-gray-900">
                {selection.site?.site_name || "—"}
              </Text>
            </View>

            <View className="w-1/2 pl-2">
              <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                WORK
              </Text>
              <Text className="text-xs font-semibold text-gray-900">
                {selection.workDesc?.desc_name || "—"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Labours <Text style={styles.required}>*</Text>
            </Text>
            
            {state.labours.length > 0 && (
              <ScrollView style={styles.laboursList} nestedScrollEnabled>
                {state.labours
                  .filter(labour => !state.selectedLabours.includes(labour.id))
                  .map(labour => (
                    <TouchableOpacity
                      key={labour.id}
                      style={styles.labourItem}
                      onPress={() => addLabour(labour.id)}
                    >
                      <Text style={styles.labourItemText}>
                        {labour.id} - {labour.full_name}
                      </Text>
                      <Ionicons name="add-circle-outline" size={20} color="#0f766e" />
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}

            {state.selectedLabours.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={styles.selectedTitle}>
                  Selected Labours ({state.selectedLabours.length})
                </Text>
                <ScrollView style={styles.selectedList} nestedScrollEnabled>
                  {state.selectedLabours.map(labourId => {
                    const labour = state.labours.find(l => l.id === labourId);
                    return (
                      <View key={labourId} style={styles.selectedItem}>
                        <View style={styles.labourInfo}>
                          <Text style={styles.labourId}>ID: {labourId}</Text>
                          <Text style={styles.labourName}>
                            {labour?.full_name || 'Unknown'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeLabour(labourId)}
                          style={styles.removeButton}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.dateContainer}>
            <View style={styles.dateField}>
              <Text style={styles.label}>
                From Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => updateState({ showFromPicker: true })}
              >
                <Text style={styles.dateText}>
                  {state.fromDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.label}>
                To Date <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => updateState({ showToPicker: true })}
              >
                <Text style={styles.dateText}>
                  {state.toDate.toLocaleDateString()}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {state.showFromPicker && (
            <DateTimePicker
              value={state.fromDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleFromDateChange}
            />
          )}

          {state.showToPicker && (
            <DateTimePicker
              value={state.toDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={state.fromDate}
              onChange={handleToDateChange}
            />
          )}

          {state.loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0f766e" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || state.submitting) && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveAssignment}
            disabled={!isFormValid || state.submitting}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {state.submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color="white" />
              )}
              <Text style={styles.saveButtonText}>
                {state.submitting ? 'Saving...' : 'Save Assignment'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  contentContainer: {
    paddingVertical: 12,
  },
  selectionBox: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'grey',
    shadowColor: 'grey',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    backgroundColor: 'white',
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'grey',
    shadowColor: 'grey',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#dc2626',
  },
  laboursList: {
    maxHeight: 150,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  labourItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  labourItemText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedContainer: {
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 10,
  },
  selectedList: {
    maxHeight: 120,
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labourInfo: {
    flex: 1,
  },
  labourId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
  },
  labourName: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateInput: {
    height: 48,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowColor: '#94a3b8',
    shadowOpacity: 0.15,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});