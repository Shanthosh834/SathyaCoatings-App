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
// } from "react-native";
// import axios from "axios";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import Toast from "react-native-toast-message";
// import { Ionicons } from "@expo/vector-icons";

// const API_CONFIG = {
//   BASE_URL: "http://ip",
//   TIMEOUT: 15000,
//   RETRY_ATTEMPTS: 3,
//   RETRY_DELAY: 1000,
// };

// const apiClient = axios.create({
//   baseURL: API_CONFIG.BASE_URL,
//   timeout: API_CONFIG.TIMEOUT,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//     'Cache-Control': 'no-cache',
//   },
// });

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
//   const { selection, encodedUserId } = route?.params || {};
  
//   useEffect(() => {
//     if (!selection || !selection.company || !selection.project || !selection.site || !selection.workDesc) {
//       Toast.show({
//         type: 'error',
//         text1: 'Missing Selection Data',
//         text2: 'Please select work details from the previous page',
//       });
//     }
//   }, [selection]);

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
//   });

//   const updateState = useCallback((updates) => {
//     setState(prevState => ({ ...prevState, ...updates }));
//   }, []);

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

//   const isFormValid = useMemo(() =>
//     selection &&
//     selection.company &&
//     selection.project &&
//     selection.site &&
//     selection.workDesc &&
//     Array.isArray(state.selectedLabours) &&
//     state.selectedLabours.length > 0 &&
//     state.fromDate &&
//     state.toDate &&
//     state.toDate >= state.fromDate
//   , [selection, state.selectedLabours, state.fromDate, state.toDate]);

//   const handleSaveAssignment = useCallback(async () => {
//     if (!isFormValid) {
//       Toast.show({
//         type: 'error',
//         text1: 'Incomplete Form',
//         text2: 'Please fill all required fields',
//       });
//       return;
//     }

//     if (!validateDates()) return;

//     const userId = validateAndDecodeUserId();
//     if (!userId) return;

//     const payload = {
//       project_id: selection.project.project_id,
//       site_id: selection.site.site_id,
//       desc_id: selection.workDesc.desc_id,
//       labour_ids: state.selectedLabours,
//       from_date: state.fromDate.toISOString().split('T')[0],
//       to_date: state.toDate.toISOString().split('T')[0],
//       created_by: userId,
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
//   }, [isFormValid, validateDates, validateAndDecodeUserId, selection, state, updateState]);

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

//   if (!selection || !selection.company || !selection.project || !selection.site || !selection.workDesc) {
//     return (
//       <View style={[styles.container, styles.centerContent]}>
//         <Ionicons name="warning" size={64} color="#f59e0b" />
//         <Text style={styles.errorTitle}>Selection Required</Text>
//         <Text style={styles.errorText}>
//           Please go back and select your work details first
//         </Text>
//       </View>
//     );
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
//         <View style={styles.selectionBox}>
//           <View className="flex-row flex-wrap">
//             <View className="w-1/2 mb-2 pr-2">
//               <Text className="text-[10px] uppercase tracking-wide text-gray-500">
//                 COMPANY
//               </Text>
//               <Text className="text-xs font-semibold text-gray-900">
//                 {selection.company?.company_name || "—"}
//               </Text>
//             </View>

//             <View className="w-1/2 mb-2 pl-2">
//               <Text className="text-[10px] uppercase tracking-wide text-gray-500">
//                 PROJECT
//               </Text>
//               <Text className="text-xs font-semibold text-gray-900">
//                 {selection.project?.project_name || "—"}
//               </Text>
//             </View>

//             <View className="w-1/2 pr-2">
//               <Text className="text-[10px] uppercase tracking-wide text-gray-500">
//                 SITE
//               </Text>
//               <Text className="text-xs font-semibold text-gray-900">
//                 {selection.site?.site_name || "—"}
//               </Text>
//             </View>

//             <View className="w-1/2 pl-2">
//               <Text className="text-[10px] uppercase tracking-wide text-gray-500">
//                 WORK
//               </Text>
//               <Text className="text-xs font-semibold text-gray-900">
//                 {selection.workDesc?.desc_name || "—"}
//               </Text>
//             </View>
//           </View>
//         </View>

//         <View style={styles.form}>
//           <View style={styles.fieldContainer}>
//             <Text style={styles.label}>
//               Labours <Text style={styles.required}>*</Text>
//             </Text>
            
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

//           {state.loading && (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="small" color="#0f766e" />
//               <Text style={styles.loadingText}>Loading data...</Text>
//             </View>
//           )}

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
//   centerContent: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   contentContainer: {
//     paddingVertical: 12,
//   },
//   selectionBox: {
//     backgroundColor: 'white',
//     marginHorizontal: 12,
//     marginBottom: 16,
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 0.5,
//     borderColor: 'grey',
//     shadowColor: 'grey',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#6b7280',
//     textAlign: 'center',
//     lineHeight: 24,
//   },
//   form: {
//     backgroundColor: 'white',
//     marginHorizontal: 12,
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 0.5,
//     borderColor: 'grey',
//     shadowColor: 'grey',
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
// });

// export default LabourAssign;


import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const API_BASE = "http://ip";

export default function LabourAssign({ route }) {
  const { selection } = route?.params || {};

  const [labours, setLabours] = useState([]);
  const [selectedLabours, setSelectedLabours] = useState([]);
  const [fromDate, setFromDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLabourModal, setShowLabourModal] = useState(false);
  const [showAssignedModal, setShowAssignedModal] = useState(false);
  const [assignedLabours, setAssignedLabours] = useState([]);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editFromDate, setEditFromDate] = useState("");
  const [editToDate, setEditToDate] = useState("");
  const [editSalary, setEditSalary] = useState("");

  useEffect(() => {
    if (selection?.site) {
      fetchLabours();
    }
  }, [selection]);

  const fetchLabours = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/site-incharge/labours`);
      console.log("Labours API Response:", response.data);
      const laboursData = response.data.data || response.data || [];
      setLabours(Array.isArray(laboursData) ? laboursData : []);
    } catch (error) {
      console.error("Error fetching labours:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to fetch labours");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLabour = (labour) => {
    const isSelected = selectedLabours.some((l) => l.id === labour.id);
    if (isSelected) {
      setSelectedLabours(selectedLabours.filter((l) => l.id !== labour.id));
    } else {
      setSelectedLabours([...selectedLabours, labour]);
    }
  };

  const handleRemoveLabour = (labourId) => {
    setSelectedLabours(selectedLabours.filter((l) => l.id !== labourId));
  };

  const handleSaveAssignment = async () => {
    if (!selection?.project || !selection?.site || !selection?.workDesc) {
      Alert.alert("Error", "Please select project, site, and work description first");
      return;
    }

    if (selectedLabours.length === 0) {
      Alert.alert("Error", "Please select at least one labour");
      return;
    }

    if (!fromDate || !toDate) {
      Alert.alert("Error", "Please select from and to dates");
      return;
    }

    if (new Date(toDate) < new Date(fromDate)) {
      Alert.alert("Error", "To date cannot be before from date");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        project_id: selection.project.project_id,
        site_id: selection.site.site_id,
        desc_id: selection.workDesc.desc_id,
        labour_ids: selectedLabours.map((labour) => labour.id),
        from_date: fromDate,
        to_date: toDate,
        created_by: 1,
      };

      console.log("Sending assignment payload:", payload);

      const response = await axios.post(
        `${API_BASE}/site-incharge/save-labour-assignment`,
        payload
      );

      console.log("Assignment saved successfully:", response.data);
      Alert.alert("Success", response.data.message || "Labour assignment saved successfully");
      
      setSelectedLabours([]);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      setFromDate(todayStr);
      setToDate(todayStr);
      
    } catch (error) {
      console.error("Error saving assignment:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to save labour assignment";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewAssignedLabours = async () => {
    if (!selection?.project || !selection?.site || !selection?.workDesc) {
      Alert.alert("Error", "Please select project, site, and work description");
      return;
    }

    try {
      setLoading(true);
      const url = `${API_BASE}/site-incharge/assigned-labours?project_id=${selection.project.project_id}&site_id=${selection.site.site_id}&desc_id=${selection.workDesc.desc_id}`;
      console.log("Fetching assigned labours from:", url);
      
      const response = await axios.get(url);
      console.log("Assigned labours response:", response.data);
      
      const assignedData = response.data.data || response.data || [];
      setAssignedLabours(Array.isArray(assignedData) ? assignedData : []);
      setShowAssignedModal(true);
    } catch (error) {
      console.error("Error fetching assigned labours:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to fetch assigned labours";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    setEditingAssignmentId(assignment.id);
    setEditFromDate(assignment.from_date.split("T")[0]);
    setEditToDate(assignment.to_date.split("T")[0]);
    setEditSalary(assignment.salary ? assignment.salary.toString() : "");
  };

  const handleUpdateAssignment = async (assignmentId) => {
    if (!editFromDate || !editToDate) {
      Alert.alert("Error", "Please fill from and to dates");
      return;
    }

    if (new Date(editToDate) < new Date(editFromDate)) {
      Alert.alert("Error", "To date cannot be before from date");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        assignment_id: assignmentId,
        from_date: editFromDate,
        to_date: editToDate,
        salary: editSalary ? parseFloat(editSalary) : null,
        updated_by: 1,
      };

      console.log("Updating assignment with payload:", payload);

      const response = await axios.put(
        `${API_BASE}/site-incharge/update-labour-assignment`,
        payload
      );

      console.log("Assignment updated successfully:", response.data);
      Alert.alert("Success", response.data.message || "Labour assignment updated successfully");
      
      setEditingAssignmentId(null);
      setEditFromDate("");
      setEditToDate("");
      setEditSalary("");
      
      await handleViewAssignedLabours();
      
    } catch (error) {
      console.error("Error updating assignment:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          "Failed to update labour assignment";
      Alert.alert("Error", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Labour Assignment</Text>
        <TouchableOpacity
          onPress={handleViewAssignedLabours}
          disabled={!selection?.workDesc || loading}
          style={[
            styles.viewButton,
            (!selection?.workDesc || loading) && styles.viewButtonDisabled,
          ]}
        >
          <Ionicons name="eye-outline" size={16} color="#fff" />
          <Text style={styles.viewButtonText}>View Assigned</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Selection Info */}
        {selection && (
          <View style={styles.selectionInfo}>
            <View style={styles.selectionRow}>
              <View style={styles.selectionItem}>
                <Text style={styles.selectionLabel}>COMPANY</Text>
                <Text style={styles.selectionValue}>{selection.company?.company_name || "—"}</Text>
              </View>
              <View style={styles.selectionItem}>
                <Text style={styles.selectionLabel}>PROJECT</Text>
                <Text style={styles.selectionValue}>{selection.project?.project_name || "—"}</Text>
              </View>
            </View>
            <View style={styles.selectionRow}>
              <View style={styles.selectionItem}>
                <Text style={styles.selectionLabel}>SITE</Text>
                <Text style={styles.selectionValue}>{selection.site?.site_name || "—"}</Text>
              </View>
              <View style={styles.selectionItem}>
                <Text style={styles.selectionLabel}>WORK</Text>
                <Text style={styles.selectionValue}>{selection.workDesc?.desc_name || "—"}</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.formContainer}>
          {/* Select Labours Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Labours <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowLabourModal(true)}
              disabled={loading || !selection?.site}
              style={[
                styles.selectButton,
                (loading || !selection?.site) && styles.selectButtonDisabled,
              ]}
            >
              <Text style={styles.selectButtonText}>
                {selectedLabours.length > 0
                  ? `${selectedLabours.length} Labour(s) Selected`
                  : "Tap to Select Labours"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Selected Labours Display */}
          {selectedLabours.length > 0 && (
            <View style={styles.selectedSection}>
              <Text style={styles.selectedTitle}>
                Selected Labours ({selectedLabours.length})
              </Text>
              <View style={styles.selectedLaboursContainer}>
                {selectedLabours.map((labour) => (
                  <View key={labour.id} style={styles.selectedLabourCard}>
                    <View style={styles.labourCardContent}>
                      <View style={styles.labourCardHeader}>
                        <View style={styles.labourInfo}>
                          <Text style={styles.labourId}>ID: {labour.id}</Text>
                          <Text style={styles.labourName}>{labour.full_name}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveLabour(labour.id)}
                          style={styles.removeButton}
                        >
                          <Ionicons name="close" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Date Selection */}
          <View style={styles.dateContainer}>
            <View style={styles.dateField}>
              <Text style={styles.sectionLabel}>
                From Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateText}>{fromDate}</Text>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
              </View>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.sectionLabel}>
                To Date <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateText}>{toDate}</Text>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveAssignment}
            disabled={submitting || selectedLabours.length === 0}
            style={[
              styles.saveButton,
              (submitting || selectedLabours.length === 0) && styles.saveButtonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Save Assignment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Labour Selection Modal */}
      <Modal visible={showLabourModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Labours</Text>
              <TouchableOpacity onPress={() => setShowLabourModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
              </View>
            ) : (
              <FlatList
                data={labours}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  const isSelected = selectedLabours.some((l) => l.id === item.id);
                  return (
                    <TouchableOpacity
                      onPress={() => handleToggleLabour(item)}
                      style={[
                        styles.labourItem,
                        isSelected && styles.labourItemSelected,
                      ]}
                    >
                      <View style={styles.labourItemContent}>
                        <Text style={styles.labourItemName}>{item.full_name}</Text>
                        <Text style={styles.labourItemId}>ID: {item.id}</Text>
                        {item.mobile && (
                          <Text style={styles.labourItemMobile}>Mobile: {item.mobile}</Text>
                        )}
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={24} color="#14b8a6" />
                      ) : (
                        <Ionicons name="add-circle-outline" size={24} color="#0f766e" />
                      )}
                    </TouchableOpacity>
                  );
                }}
                style={styles.modalList}
              />
            )}

            <TouchableOpacity
              onPress={() => setShowLabourModal(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assigned Labours Modal */}
      <Modal visible={showAssignedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assigned Labours</Text>
              <TouchableOpacity onPress={() => setShowAssignedModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
              </View>
            ) : assignedLabours.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No assigned labours found</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {assignedLabours.map((assignment) => (
                  <View key={assignment.id} style={styles.assignmentCard}>
                    <View style={styles.assignmentHeader}>
                      <View>
                        <Text style={styles.assignmentName}>{assignment.full_name}</Text>
                        <Text style={styles.assignmentId}>ID: {assignment.labour_id}</Text>
                        {assignment.mobile && (
                          <Text style={styles.assignmentMobile}>Mobile: {assignment.mobile || 'N/A'}</Text>
                        )}
                      </View>
                      {assignment.is_editable && editingAssignmentId !== assignment.id && (
                        <TouchableOpacity
                          onPress={() => handleEditAssignment(assignment)}
                          style={styles.editButton}
                        >
                          <Ionicons name="create-outline" size={16} color="#3b82f6" />
                          <Text style={styles.editButtonText}>Edit Dates</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {editingAssignmentId === assignment.id ? (
                      <View style={styles.editForm}>
                        <View style={styles.editField}>
                          <Text style={styles.editLabel}>From Date</Text>
                          <View style={styles.editDateInput}>
                            <Text style={styles.editDateText}>{editFromDate}</Text>
                            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                          </View>
                        </View>

                        <View style={styles.editField}>
                          <Text style={styles.editLabel}>To Date</Text>
                          <View style={styles.editDateInput}>
                            <Text style={styles.editDateText}>{editToDate}</Text>
                            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                          </View>
                        </View>

                        <View style={styles.editField}>
                          <Text style={styles.editLabel}>Salary</Text>
                          <TextInput
                            style={styles.editSalaryInput}
                            value={editSalary}
                            onChangeText={setEditSalary}
                            placeholder="Enter salary"
                            keyboardType="numeric"
                          />
                        </View>

                        <View style={styles.editActions}>
                          <TouchableOpacity
                            onPress={() => handleUpdateAssignment(assignment.id)}
                            disabled={submitting}
                            style={[styles.updateButton, submitting && styles.updateButtonDisabled]}
                          >
                            {submitting ? (
                              <ActivityIndicator color="#fff" size="small" />
                            ) : (
                              <>
                                <Ionicons name="checkmark" size={12} color="#fff" />
                                <Text style={styles.updateButtonText}>Update</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingAssignmentId(null);
                              setEditFromDate("");
                              setEditToDate("");
                              setEditSalary("");
                            }}
                            style={styles.cancelButton}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.assignmentDetails}>
                        <Text style={styles.assignmentDetail}>
                          From: {formatDateForDisplay(assignment.from_date)}
                        </Text>
                        <Text style={styles.assignmentDetail}>
                          To: {formatDateForDisplay(assignment.to_date)}
                        </Text>
                        <Text style={styles.assignmentDetail}>
                          Salary: {assignment.salary || "N/A"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  viewButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    padding: 12,
  },
  selectionInfo: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "grey",
    shadowColor: "grey",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectionRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  selectionItem: {
    flex: 1,
    paddingRight: 8,
  },
  selectionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectionValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "grey",
    shadowColor: "grey",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  required: {
    color: "#dc2626",
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
  },
  selectButtonDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  selectButtonText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  selectedSection: {
    marginBottom: 18,
  },
  selectedTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0369a1",
    marginBottom: 10,
  },
  selectedLaboursContainer: {
    gap: 6,
  },
  selectedLabourCard: {
    backgroundColor: "#fff",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  labourCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  labourCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  labourInfo: {
    flex: 1,
  },
  labourId: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  labourName: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateInputContainer: {
    height: 48,
    borderWidth: 1.5,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f766e",
    padding: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#0f766e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#94a3b8",
    shadowColor: "#94a3b8",
    shadowOpacity: 0.15,
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: "80%",
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#14b8a6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  modalList: {
    maxHeight: 500,
  },
  labourItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  labourItemSelected: {
    backgroundColor: "#f0fdfa",
  },
  labourItemContent: {
    flex: 1,
  },
  labourItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 2,
  },
  labourItemId: {
    fontSize: 13,
    color: "#6b7280",
  },
  labourItemMobile: {
    fontSize: 12,
    color: "#6b7280",
  },
  modalCloseButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f3f4f6",
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  loadingContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
  },
  assignmentCard: {
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  assignmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  assignmentName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  assignmentId: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  assignmentMobile: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#3b82f6",
  },
  assignmentDetails: {
    gap: 4,
  },
  assignmentDetail: {
    fontSize: 13,
    color: "#6b7280",
  },
  editForm: {
    gap: 10,
    marginTop: 8,
  },
  editField: {
    gap: 4,
  },
  editLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  editDateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  editDateText: {
    fontSize: 14,
    color: "#374151",
  },
  editSalaryInput: {
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 14,
    color: "#374151",
  },
  editActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  updateButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#10b981",
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  updateButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6b7280",
    padding: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});