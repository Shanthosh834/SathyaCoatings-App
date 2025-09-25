// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   ActivityIndicator,
//   RefreshControl,
//   Platform,
//   Alert,
// } from "react-native";
// import axios from "axios";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import Toast from "react-native-toast-message";
// import { Ionicons } from "@expo/vector-icons";
// import LabourAttendance from "./LabourAttendance";

// // API Configuration
// const API_CONFIG = {
//   BASE_URL: "http://103.118.158.127/api",
//   TIMEOUT: 15000,
//   RETRY_ATTEMPTS: 3,
//   RETRY_DELAY: 1000,
// };

// // Create axios instance with professional configuration
// const apiClient = axios.create({
//   baseURL: API_CONFIG.BASE_URL,
//   timeout: API_CONFIG.TIMEOUT,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//     'Cache-Control': 'no-cache',
//   },
// });

// // Request interceptor
// apiClient.interceptors.request.use(
//   (config) => {
//     const timestamp = new Date().toISOString();
//     console.log(`[${timestamp}] 🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
//     return config;
//   },
//   (error) => {
//     console.error('[API] Request interceptor error:', error);
//     return Promise.reject(error);
//   }
// );

// // Response interceptor with retry logic
// apiClient.interceptors.response.use(
//   (response) => {
//     const timestamp = new Date().toISOString();
//     console.log(`[${timestamp}] ✅ API Response: ${response.status} ${response.config.url}`);
//     return response;
//   },
//   async (error) => {
//     const timestamp = new Date().toISOString();
//     console.error(`[${timestamp}] ❌ API Error:`, {
//       status: error.response?.status,
//       message: error.message,
//       url: error.config?.url,
//       data: error.response?.data,
//     });

//     // Retry logic for network errors
//     if (error.config && !error.config.__isRetryRequest) {
//       error.config.__isRetryRequest = true;
      
//       if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
//         for (let i = 0; i < API_CONFIG.RETRY_ATTEMPTS; i++) {
//           try {
//             await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (i + 1)));
//             console.log(`[${timestamp}] 🔄 Retrying request (${i + 1}/${API_CONFIG.RETRY_ATTEMPTS})`);
//             return await apiClient.request(error.config);
//           } catch (retryError) {
//             if (i === API_CONFIG.RETRY_ATTEMPTS - 1) {
//               console.error(`[${timestamp}] 💥 All retry attempts failed`);
//             }
//           }
//         }
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// // Error handler utility
// const handleApiError = (error, context = '') => {
//   const timestamp = new Date().toISOString();
//   console.error(`[${timestamp}] Error in ${context}:`, {
//     message: error.message,
//     status: error.response?.status,
//     data: error.response?.data,
//     url: error.config?.url,
//   });

//   let userMessage = `Failed to ${context.toLowerCase()}`;
  
//   switch (error.response?.status) {
//     case 400:
//       userMessage = error.response?.data?.message || 'Invalid request data';
//       break;
//     case 401:
//       userMessage = 'Authentication required';
//       break;
//     case 403:
//       userMessage = 'Access forbidden';
//       break;
//     case 404:
//       userMessage = 'Resource not found';
//       break;
//     case 422:
//       userMessage = 'Validation failed';
//       break;
//     case 429:
//       userMessage = 'Too many requests - please wait';
//       break;
//     case 500:
//       userMessage = 'Server error - please try again';
//       break;
//     case 502:
//     case 503:
//     case 504:
//       userMessage = 'Service unavailable - please try later';
//       break;
//     default:
//       if (error.code === 'ECONNABORTED') {
//         userMessage = 'Request timeout - check connection';
//       } else if (error.message === 'Network Error') {
//         userMessage = 'Network error - check connectivity';
//       }
//   }

//   return userMessage;
// };

// // API service functions
// const apiService = {
//   async fetchLabours() {
//     const response = await apiClient.get('/site-incharge/labours');
//     return response.data?.data || response.data || [];
//   },

//   async saveLabourAssignment(payload) {
//     const response = await apiClient.post('/site-incharge/save-labour-assignment', payload);
//     return response.data;
//   },
// };

// export default function LabourAssign({ route }) {
//   // Extract parameters safely
//   const encodedUserId = route?.params?.encodedUserId || 'dGVzdA==';

//   // State management - removed dropdown-related states
//   const [state, setState] = useState({
//     labours: [],
//     selectedLabours: [],
//     fromDate: new Date(),
//     toDate: new Date(),
//     showFromPicker: false,
//     showToPicker: false,
//     loading: false,
//     submitting: false,
//     refreshing: false,
//     assignmentSaved: false,
//     showAttendancePage: false,
//   });

//   // State update helper
//   const updateState = useCallback((updates) => {
//     setState(prevState => ({ ...prevState, ...updates }));
//   }, []);

//   // Fetch labours on component mount
//   useEffect(() => {
//     const fetchLabours = async () => {
//       try {
//         updateState({ loading: true });
//         const labours = await apiService.fetchLabours();
//         console.log('Labours fetched:', labours);
//         updateState({ labours });
//       } catch (error) {
//         const message = handleApiError(error, 'fetch labours');
//         Toast.show({ type: 'error', text1: message });
//       } finally {
//         updateState({ loading: false });
//       }
//     };

//     fetchLabours();
//   }, [updateState]);

//   // Date validation
//   const validateDates = useCallback(() => {
//     if (state.toDate < state.fromDate) {
//       Toast.show({
//         type: 'error',
//         text1: 'Invalid Date Range',
//         text2: 'End date must be after start date',
//       });
//       return false;
//     }
//     return true;
//   }, [state.fromDate, state.toDate]);

//   // User ID validation and decoding
//   const validateAndDecodeUserId = useCallback(() => {
//     if (!encodedUserId) {
//       Toast.show({
//         type: 'error',
//         text1: 'Authentication Error',
//         text2: 'User ID is missing',
//       });
//       return null;
//     }

//     try {
//       const decodedUserId = atob(encodedUserId);
//       if (decodedUserId === 'test' || /^\d+$/.test(decodedUserId)) {
//         return decodedUserId === 'test' ? 1 : parseInt(decodedUserId, 10);
//       }
//       throw new Error('Invalid format');
//     } catch {
//       Toast.show({
//         type: 'error',
//         text1: 'Authentication Error',
//         text2: 'Invalid user credentials',
//       });
//       return null;
//     }
//   }, [encodedUserId]);

//   // Form validation - simplified without dropdown requirements
//   const isFormValid = useMemo(() =>
//     Array.isArray(state.selectedLabours) &&
//     state.selectedLabours.length > 0 &&
//     state.fromDate &&
//     state.toDate &&
//     state.toDate >= state.fromDate
//   , [state.selectedLabours, state.fromDate, state.toDate]);

//   // Save assignment handler - simplified payload
//   const handleSaveAssignment = useCallback(async () => {
//     // Validation
//     if (!isFormValid) {
//       Toast.show({
//         type: 'error',
//         text1: 'Incomplete Form',
//         text2: 'Please select labours and date range',
//       });
//       return;
//     }

//     if (!validateDates()) return;

//     const userId = validateAndDecodeUserId();
//     if (!userId) return;

//     // Simplified payload - you may need to adjust these values based on your backend requirements
//     const payload = {
//       labour_ids: state.selectedLabours,
//       from_date: state.fromDate.toISOString().split('T')[0],
//       to_date: state.toDate.toISOString().split('T')[0],
//       created_by: userId,
//       // You might need to provide default values or get these from props/context
//       // project_id: 1,
//       // site_id: 1,
//       // desc_id: 1,
//     };

//     console.log('Sending payload:', payload);

//     try {
//       updateState({ submitting: true });
      
//       const response = await apiService.saveLabourAssignment(payload);
      
//       Toast.show({
//         type: 'success',
//         text1: 'Success',
//         text2: response.message || 'Assignment saved successfully',
//       });

//       // Reset form partially and show attendance button
//       updateState({
//         selectedLabours: [],
//         assignmentSaved: true,
//       });

//     } catch (error) {
//       const message = handleApiError(error, 'save assignment');
//       console.error('Save assignment error:', error.response?.data);
//       Toast.show({
//         type: 'error',
//         text1: 'Save Failed',
//         text2: message,
//       });
//     } finally {
//       updateState({ submitting: false });
//     }
//   }, [isFormValid, validateDates, validateAndDecodeUserId, state, updateState]);

//   // Refresh handler
//   const handleRefresh = useCallback(async () => {
//     try {
//       updateState({ refreshing: true });
//       const labours = await apiService.fetchLabours();
//       updateState({ labours });
//     } catch (error) {
//       const message = handleApiError(error, 'refresh data');
//       Toast.show({ type: 'error', text1: message });
//     } finally {
//       updateState({ refreshing: false });
//     }
//   }, [updateState]);

//   // Labour management
//   const addLabour = useCallback((labourId) => {
//     if (!state.selectedLabours.includes(labourId)) {
//       updateState({
//         selectedLabours: [...state.selectedLabours, labourId],
//         assignmentSaved: false,
//       });
//     }
//   }, [state.selectedLabours, updateState]);

//   const removeLabour = useCallback((labourId) => {
//     updateState({
//       selectedLabours: state.selectedLabours.filter(id => id !== labourId),
//       assignmentSaved: false,
//     });
//   }, [state.selectedLabours, updateState]);

//   // Date change handlers
//   const handleFromDateChange = useCallback((event, selectedDate) => {
//     updateState({ showFromPicker: false });
//     if (selectedDate) {
//       const updates = { fromDate: selectedDate };
//       if (selectedDate > state.toDate) {
//         updates.toDate = selectedDate;
//       }
//       updateState(updates);
//     }
//   }, [state.toDate, updateState]);

//   const handleToDateChange = useCallback((event, selectedDate) => {
//     updateState({ showToPicker: false });
//     if (selectedDate) {
//       updateState({ toDate: selectedDate });
//     }
//   }, [updateState]);

//   // Navigation handlers
//   const navigateToAttendance = useCallback(() => {
//     updateState({ showAttendancePage: true });
//   }, [updateState]);

//   const navigateBack = useCallback(() => {
//     updateState({ showAttendancePage: false });
//   }, [updateState]);

//   // Conditional rendering
//   if (state.showAttendancePage) {
//     return <LabourAttendance 
//       onBack={navigateBack} 
//       selectedLabours={state.selectedLabours}
//       laboursData={state.labours}
//     />;
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         contentContainerStyle={styles.contentContainer}
//         refreshControl={
//           <RefreshControl refreshing={state.refreshing} onRefresh={handleRefresh} />
//         }
//         showsVerticalScrollIndicator={false}
//       >
//         <View style={styles.header}>
//           <Text style={styles.title}>Labour Assignment</Text>
//           <Text style={styles.subtitle}>Assign workers to project tasks</Text>
//         </View>

//         {/* MAIN FORM CONTENT */}
//         <View style={styles.form}>
//           {/* Labour Selection */}
//           <View style={styles.fieldContainer}>
//             <Text style={styles.label}>
//               Labours <Text style={styles.required}>*</Text>
//             </Text>
            
//             {/* Available Labours */}
//             {state.labours.length > 0 && (
//               <ScrollView style={styles.laboursList} nestedScrollEnabled>
//                 {state.labours
//                   .filter(labour => !state.selectedLabours.includes(labour.id))
//                   .map(labour => (
//                     <TouchableOpacity
//                       key={labour.id}
//                       style={styles.labourItem}
//                       onPress={() => addLabour(labour.id)}
//                     >
//                       <Text style={styles.labourItemText}>
//                         {labour.id} - {labour.full_name}
//                       </Text>
//                       <Ionicons name="add-circle-outline" size={20} color="#0f766e" />
//                     </TouchableOpacity>
//                   ))}
//               </ScrollView>
//             )}

//             {/* Selected Labours Display */}
//             {state.selectedLabours.length > 0 && (
//               <View style={styles.selectedContainer}>
//                 <Text style={styles.selectedTitle}>
//                   Selected Labours ({state.selectedLabours.length})
//                 </Text>
//                 <ScrollView style={styles.selectedList} nestedScrollEnabled>
//                   {state.selectedLabours.map(labourId => {
//                     const labour = state.labours.find(l => l.id === labourId);
//                     return (
//                       <View key={labourId} style={styles.selectedItem}>
//                         <View style={styles.labourInfo}>
//                           <Text style={styles.labourId}>ID: {labourId}</Text>
//                           <Text style={styles.labourName}>
//                             {labour?.full_name || 'Unknown'}
//                           </Text>
//                         </View>
//                         <TouchableOpacity
//                           onPress={() => removeLabour(labourId)}
//                           style={styles.removeButton}
//                           hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
//                         >
//                           <Ionicons name="close" size={18} color="#ef4444" />
//                         </TouchableOpacity>
//                       </View>
//                     );
//                   })}
//                 </ScrollView>
//               </View>
//             )}
//           </View>

//           {/* Date Selection */}
//           <View style={styles.dateContainer}>
//             <View style={styles.dateField}>
//               <Text style={styles.label}>
//                 From Date <Text style={styles.required}>*</Text>
//               </Text>
//               <TouchableOpacity
//                 style={styles.dateInput}
//                 onPress={() => updateState({ showFromPicker: true })}
//               >
//                 <Text style={styles.dateText}>
//                   {state.fromDate.toLocaleDateString()}
//                 </Text>
//                 <Ionicons name="calendar-outline" size={16} color="#64748b" />
//               </TouchableOpacity>
//             </View>

//             <View style={styles.dateField}>
//               <Text style={styles.label}>
//                 To Date <Text style={styles.required}>*</Text>
//               </Text>
//               <TouchableOpacity
//                 style={styles.dateInput}
//                 onPress={() => updateState({ showToPicker: true })}
//               >
//                 <Text style={styles.dateText}>
//                   {state.toDate.toLocaleDateString()}
//                 </Text>
//                 <Ionicons name="calendar-outline" size={16} color="#64748b" />
//               </TouchableOpacity>
//             </View>
//           </View>

//           {/* Date Pickers */}
//           {state.showFromPicker && (
//             <DateTimePicker
//               value={state.fromDate}
//               mode="date"
//               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//               onChange={handleFromDateChange}
//             />
//           )}

//           {state.showToPicker && (
//             <DateTimePicker
//               value={state.toDate}
//               mode="date"
//               display={Platform.OS === 'ios' ? 'spinner' : 'default'}
//               minimumDate={state.fromDate}
//               onChange={handleToDateChange}
//             />
//           )}

//           {/* Loading Indicator */}
//           {state.loading && (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#0f766e" />
//               <Text style={styles.loadingText}>Loading data...</Text>
//             </View>
//           )}

//           {/* Save Button */}
//           <TouchableOpacity
//             style={[
//               styles.saveButton,
//               (!isFormValid || state.submitting) && styles.saveButtonDisabled,
//             ]}
//             onPress={handleSaveAssignment}
//             disabled={!isFormValid || state.submitting}
//             activeOpacity={0.8}
//           >
//             <View style={styles.buttonContent}>
//               {state.submitting ? (
//                 <ActivityIndicator size="small" color="white" />
//               ) : (
//                 <Ionicons name="checkmark-circle" size={18} color="white" />
//               )}
//               <Text style={styles.saveButtonText}>
//                 {state.submitting ? 'Saving...' : 'Save Assignment'}
//               </Text>
//             </View>
//           </TouchableOpacity>

//           {/* Labour Attendance Button */}
//           <TouchableOpacity
//             style={styles.attendanceButton}
//             onPress={navigateToAttendance}
//             activeOpacity={0.8}
//           >
//             <View style={styles.buttonContent}>
//               <Ionicons name="people" size={18} color="white" />
//               <Text style={styles.attendanceButtonText}>
//                 Labour Attendance
//               </Text>
//             </View>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>

//       <Toast />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f3f4f6',
//   },
//   contentContainer: {
//     paddingVertical: 12,
//     paddingHorizontal: 12,
//   },
//   header: {
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1e293b',
//     textAlign: 'center',
//     marginBottom: 4,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: '#64748b',
//     textAlign: 'center',
//     fontWeight: '400',
//   },
  
//   form: {
//     backgroundColor: 'white',
//     marginHorizontal: 4,
//     borderRadius: 12,
//     padding: 18,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   fieldContainer: {
//     marginBottom: 18,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 6,
//   },
//   required: {
//     color: '#dc2626',
//   },

//   // Labour Selection Styles
//   laboursList: {
//     maxHeight: 150,
//     marginBottom: 10,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     borderRadius: 8,
//     backgroundColor: '#f9fafb',
//   },
//   labourItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 12,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   labourItemText: {
//     fontSize: 14,
//     color: '#374151',
//     flex: 1,
//   },
//   selectedContainer: {
//     marginTop: 12,
//     backgroundColor: '#f0f9ff',
//     borderRadius: 8,
//     padding: 12,
//     borderWidth: 1,
//     borderColor: '#bae6fd',
//   },
//   selectedTitle: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#0369a1',
//     marginBottom: 10,
//   },
//   selectedList: {
//     maxHeight: 120,
//   },
//   selectedItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     borderRadius: 6,
//     marginBottom: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   labourInfo: {
//     flex: 1,
//   },
//   labourId: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#1f2937',
//   },
//   labourName: {
//     fontSize: 12,
//     color: '#6b7280',
//     marginTop: 2,
//   },
//   removeButton: {
//     padding: 4,
//   },
//   dateContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 18,
//     gap: 12,
//   },
//   dateField: {
//     flex: 1,
//   },
//   dateInput: {
//     height: 48,
//     borderWidth: 1.5,
//     borderColor: '#d1d5db',
//     borderRadius: 8,
//     paddingHorizontal: 14,
//     backgroundColor: 'white',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   dateText: {
//     fontSize: 16,
//     color: '#111827',
//     fontWeight: '500',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   loadingText: {
//     marginLeft: 12,
//     fontSize: 14,
//     color: '#64748b',
//     fontWeight: '500',
//   },
//   saveButton: {
//     backgroundColor: '#0f766e',
//     borderRadius: 8,
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     shadowColor: '#0f766e',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//     marginBottom: 12,
//   },
//   saveButtonDisabled: {
//     backgroundColor: '#94a3b8',
//     shadowColor: '#94a3b8',
//     shadowOpacity: 0.15,
//     elevation: 2,
//   },
//   attendanceButton: {
//     backgroundColor: '#0369a1',
//     borderRadius: 8,
//     paddingVertical: 16,
//     paddingHorizontal: 24,
//     shadowColor: '#0369a1',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   buttonContent: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   saveButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   attendanceButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
// });
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
  Alert,
} from "react-native";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import LabourAttendance from "./LabourAttendance";

// API Configuration
const API_CONFIG = {
  BASE_URL: "http://103.118.158.127/api",
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Create axios instance with professional configuration
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

// Response interceptor with retry logic
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

    // Retry logic for network errors
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

// Error handler utility
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

// API service functions
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
  // Extract parameters from route - passed from Entry page
  const { selection, encodedUserId } = route?.params || {};
  
  // Validate that selection data is available
  useEffect(() => {
    if (!selection || !selection.company || !selection.project || !selection.site || !selection.workDesc) {
      Toast.show({
        type: 'error',
        text1: 'Missing Selection Data',
        text2: 'Please select work details from the previous page',
      });
    }
  }, [selection]);

  // State management (simplified - no dropdown data needed)
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
    showAttendancePage: false,
  });

  // State update helper
  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // Fetch labours on component mount
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

  // Date validation
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

  // User ID validation and decoding
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

  // Form validation
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

  // Save assignment handler
  const handleSaveAssignment = useCallback(async () => {
    // Validation
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

    // Prepare payload using selection data from Entry page
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

      // Reset selected labours and mark as saved
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

  // Refresh handler
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

  // Labour management
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

  // Date change handlers
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

  // Navigation handlers
  const navigateToAttendance = useCallback(() => {
    updateState({ showAttendancePage: true });
  }, [updateState]);

  const navigateBack = useCallback(() => {
    updateState({ showAttendancePage: false });
  }, [updateState]);

  // Conditional rendering - moved to end to avoid hook order issues
  if (state.showAttendancePage) {
    return <LabourAttendance 
      onBack={navigateBack} 
      selectedLabours={state.selectedLabours}
      laboursData={state.labours}
    />;
  }

  // If no selection data, show error message
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
        {/* <View style={styles.header}>
          <Text style={styles.title}>Labour Assignment</Text>
          <Text style={styles.subtitle}>Assign workers to project tasks</Text>
        </View> */}

        {/* SELECTION SUMMARY */}
        <View style={styles.selectionSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Company:</Text>
            <Text style={styles.summaryValue}>{selection.company.company_name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Project:</Text>
            <Text style={styles.summaryValue}>{selection.project.project_name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Site:</Text>
            <Text style={styles.summaryValue}>{selection.site.site_name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Work:</Text>
            <Text style={styles.summaryValue}>{selection.workDesc.desc_name}</Text>
          </View>
        </View>

        {/* MAIN FORM CONTENT */}
        <View style={styles.form}>
          {/* Labour Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Labours <Text style={styles.required}>*</Text>
            </Text>
            
            {/* Available Labours */}
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

            {/* Selected Labours Display */}
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

          {/* Date Selection */}
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

          {/* Date Pickers */}
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

          {/* Loading Indicator */}
          {state.loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0f766e" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          )}

          {/* Save Button */}
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

          {/* Labour Attendance Button */}
          <TouchableOpacity
            style={styles.attendanceButton}
            onPress={navigateToAttendance}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="people" size={18} color="white" />
              <Text style={styles.attendanceButtonText}>
                Labour Attendance
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
    paddingHorizontal: 12,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '400',
  },
  
  // ERROR STATES
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
  
  // SELECTION SUMMARY STYLES
  selectionSummary: {
    backgroundColor: 'white',
    marginHorizontal: 4,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    width: '30%',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    textAlign: 'right',
  },
  
  form: {
    backgroundColor: 'white',
    marginHorizontal: 4,
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
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

  // Labour Selection Styles
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
  attendanceButton: {
    backgroundColor: '#0369a1',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#0369a1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
  attendanceButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});