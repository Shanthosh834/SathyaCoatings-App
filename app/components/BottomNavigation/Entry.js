import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  ActivityIndicator, 
  StyleSheet,
  ScrollView,
  RefreshControl 
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";
import LabourAssign from "../Labour/LabourAssign";
import Material from "../MaterialModules/MaterialDispatch";
import ExpenseEntry from "../ExpenseModules/ExpenseEntry";
import Work from "../WorkModules/Work";

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

const Stack = createNativeStackNavigator();

// ===============================
// Enhanced Dropdown Components
// ===============================
const DropdownButton = ({ label, value, onPress, disabled, type }) => {
  const getDisplayText = () => {
    if (!value) return `Select ${label}`;
    
    switch (type) {
      case 'company':
        return value.company_name;
      case 'project':
        return value.project_name;
      case 'site':
        return value.site_name;
      case 'workDesc':
        return value.desc_name;
      default:
        return `Select ${label}`;
    }
  };

  return (
    <View style={styles.dropdownContainer}>
      <Text style={styles.dropdownLabel}>{label}</Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.dropdownButton,
          disabled ? styles.dropdownButtonDisabled : styles.dropdownButtonEnabled
        ]}
      >
        <View style={styles.dropdownButtonContent}>
          <Text style={[
            styles.dropdownButtonText,
            !value ? styles.dropdownPlaceholder : (disabled ? styles.dropdownDisabledText : styles.dropdownActiveText)
          ]}>
            {getDisplayText()}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#888" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const DropdownModal = ({ visible, onClose, data, onSelect, title, keyProp, type }) => {
  const getItemText = (item) => {
    switch (type) {
      case 'company':
        return item.company_name;
      case 'project':
        return item.project_name;
      case 'site':
        return item.site_name;
      case 'workDesc':
        return item.desc_name;
      default:
        return 'Unknown';
    }
  };

  return (
    <Modal visible={visible} transparent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
            </View>

            <FlatList
              data={data}
              keyExtractor={(item) => String(item[keyProp])}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>
                    {getItemText(item)}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
              style={styles.modalList}
            />

            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// ===============================
// Updated ModuleCard - Simplified without colors and tap button
// ===============================
const ModuleCard = ({ title, iconName, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.moduleCard}
    activeOpacity={0.7}
  >
    {/* Header */}
    <View style={styles.moduleCardHeader}>
      <Text style={styles.moduleCardTitle}>
        {title}
      </Text>
    </View>

    {/* Icon */}
    <View style={styles.moduleCardIconContainer}>
      <Ionicons name={iconName} size={36} color="#6b7280" />
    </View>
  </TouchableOpacity>
);

// ===============================
// Screen 1: Dropdown Selection
// ===============================
function EntryDropdownScreen() {
  const navigation = useNavigation();

  // State management
  const [state, setState] = useState({
    companies: [],
    projects: [],
    sites: [],
    workDescs: [],
    selectedCompany: null,
    selectedProject: null,
    selectedSite: null,
    loading: false,
    refreshing: false,
    // Modal visibility states
    companyModalVisible: false,
    projectModalVisible: false,
    siteModalVisible: false,
    workDescModalVisible: false,
  });

  // State update helper
  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  // API service functions
  const apiService = {
    async fetchCompanies() {
      const response = await apiClient.get('/project/companies');
      return response.data || [];
    },

    async fetchProjects() {
      const response = await apiClient.get('/project/projects-with-sites');
      return response.data || [];
    },

    async fetchWorkDescriptions(siteId) {
      const response = await apiClient.get(`/material/work-descriptions?site_id=${siteId}`);
      return response.data?.data || response.data || [];
    },
  };

  // Fetch companies on component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        updateState({ loading: true });
        const companies = await apiService.fetchCompanies();
        console.log('Companies fetched:', companies);
        updateState({ companies });
      } catch (error) {
        const message = handleApiError(error, 'fetch companies');
        console.error(message);
      } finally {
        updateState({ loading: false });
      }
    };

    fetchCompanies();
  }, [updateState]);

  // Update projects when company changes
  useEffect(() => {
    if (state.selectedCompany) {
      const fetchProjects = async () => {
        try {
          updateState({ loading: true });
          const allProjects = await apiService.fetchProjects();
          const filteredProjects = allProjects.filter(project => project.company_id === state.selectedCompany.company_id);
          console.log('Filtered projects:', filteredProjects);
          updateState({ 
            projects: filteredProjects,
            selectedProject: null,
            sites: [],
            selectedSite: null,
            workDescs: [],
          });
        } catch (error) {
          const message = handleApiError(error, 'fetch projects');
          console.error(message);
        } finally {
          updateState({ loading: false });
        }
      };

      fetchProjects();
    } else {
      updateState({
        projects: [],
        selectedProject: null,
        sites: [],
        selectedSite: null,
        workDescs: [],
      });
    }
  }, [state.selectedCompany, updateState]);

  // Update sites when project changes
  useEffect(() => {
    if (state.selectedProject) {
      const selectedProjectData = state.projects.find(
        project => project.project_id === state.selectedProject.project_id
      );
      
      console.log('Selected project sites:', selectedProjectData?.sites);
      updateState({
        sites: selectedProjectData?.sites || [],
        selectedSite: null,
        workDescs: [],
      });
    }
  }, [state.selectedProject, state.projects, updateState]);

  // Fetch work descriptions when site is selected
  useEffect(() => {
    if (state.selectedSite) {
      const fetchWorkDescs = async () => {
        try {
          updateState({ loading: true });
          const workDescs = await apiService.fetchWorkDescriptions(state.selectedSite.site_id);
          console.log('Work descriptions:', workDescs);
          updateState({ workDescs });
        } catch (error) {
          const message = handleApiError(error, 'fetch work descriptions');
          console.error(message);
        } finally {
          updateState({ loading: false });
        }
      };

      fetchWorkDescs();
    }
  }, [state.selectedSite, updateState]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    try {
      updateState({ refreshing: true });
      const companies = await apiService.fetchCompanies();
      updateState({ companies });
    } catch (error) {
      const message = handleApiError(error, 'refresh data');
      console.error(message);
    } finally {
      updateState({ refreshing: false });
    }
  }, [updateState]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={state.refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Work Selection</Text>
          <Text style={styles.subtitle}>Choose your project details</Text>
        </View>

        <View style={styles.dropdownSection}>
          <DropdownButton
            label="Company"
            value={state.selectedCompany}
            onPress={() => updateState({ companyModalVisible: true })}
            disabled={false}
            type="company"
          />

          <DropdownButton
            label="Project"
            value={state.selectedProject}
            onPress={() => updateState({ projectModalVisible: true })}
            disabled={!state.selectedCompany}
            type="project"
          />

          <DropdownButton
            label="Site"
            value={state.selectedSite}
            onPress={() => updateState({ siteModalVisible: true })}
            disabled={!state.selectedProject}
            type="site"
          />

          <DropdownButton
            label="Work Description"
            value={null}
            onPress={() => updateState({ workDescModalVisible: true })}
            disabled={!state.selectedSite}
            type="workDesc"
          />

          {/* Loading Indicator */}
          {state.loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0f766e" />
              <Text style={styles.loadingText}>Loading data...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* DROPDOWN MODALS */}
      <DropdownModal
        visible={state.companyModalVisible}
        onClose={() => updateState({ companyModalVisible: false })}
        data={state.companies}
        title="Select Company"
        keyProp="company_id"
        type="company"
        onSelect={(item) => {
          updateState({ 
            selectedCompany: item, 
            companyModalVisible: false,
            projectModalVisible: true
          });
        }}
      />

      <DropdownModal
        visible={state.projectModalVisible}
        onClose={() => updateState({ projectModalVisible: false })}
        data={state.projects}
        title="Select Project"
        keyProp="project_id"
        type="project"
        onSelect={(item) => {
          updateState({ 
            selectedProject: item, 
            projectModalVisible: false,
            siteModalVisible: true
          });
        }}
      />

      <DropdownModal
        visible={state.siteModalVisible}
        onClose={() => updateState({ siteModalVisible: false })}
        data={state.sites}
        title="Select Site"
        keyProp="site_id"
        type="site"
        onSelect={(item) => {
          updateState({ 
            selectedSite: item, 
            siteModalVisible: false,
            workDescModalVisible: true
          });
        }}
      />

      <DropdownModal
        visible={state.workDescModalVisible}
        onClose={() => updateState({ workDescModalVisible: false })}
        data={state.workDescs}
        title="Select Work Description"
        keyProp="desc_id"
        type="workDesc"
        onSelect={(item) => {
          const selection = {
            company: state.selectedCompany,
            project: state.selectedProject,
            site: state.selectedSite,
            workDesc: item,
          };
          updateState({ workDescModalVisible: false });
          navigation.navigate("ModuleSelection", { selection });
        }}
      />
    </View>
  );
}

// ===============================
// Screen 2: Module Selection Cards
// ===============================
function ModuleSelectionScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { selection } = route.params || {};

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Module</Text>
          <Text style={styles.subtitle}>
            Selected: {selection?.workDesc?.desc_name}
          </Text>
        </View>

        <View style={styles.moduleGrid}>
          <ModuleCard 
            title="Material" 
            iconName="cube-outline" 
            onPress={() => navigation.navigate("MaterialModule", { selection })} 
          />
          <ModuleCard 
            title="Expense" 
            iconName="cash-outline" 
            onPress={() => navigation.navigate("ExpenseModule", { selection })} 
          />
          <ModuleCard 
            title="Work" 
            iconName="clipboard-outline" 
            onPress={() => navigation.navigate("WorkModule", { selection })} 
          />
          <ModuleCard 
            title="Labour" 
            iconName="people-outline" 
            onPress={() => navigation.navigate("LabourModule", { selection })} 
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ===============================
// Screen 3: Material Module
// ===============================
function MaterialModuleScreen() {
  const route = useRoute();
  const { selection } = route.params || {};

  return (
    <View style={styles.container}>
      <Material 
        route={{ params: { 
          selection,
          encodedUserId: 'dGVzdA==' // You might want to get this from your auth context
        }}} 
      />
    </View>
  );
}

// ===============================
// Screen 4: Expense Module
// ===============================
function ExpenseModuleScreen() {
  const route = useRoute();
  const { selection } = route.params || {};

  return (
    <View style={styles.container}>
      <ExpenseEntry 
        route={{ params: { 
          selection,
          encodedUserId: 'dGVzdA==' // You might want to get this from your auth context
        }}} 
      />
    </View>
  );
}

// ===============================
// Screen 5: Work Module
// ===============================
function WorkModuleScreen() {
  const route = useRoute();
  const { selection } = route.params || {};

  return (
    <View style={styles.container}>
      <Work 
        route={{ params: { 
          selection,
          encodedUserId: 'dGVzdA==' // You might want to get this from your auth context
        }}} 
      />
    </View>
  );
}

// ===============================
// Screen 6: Labour Module
// ===============================
function LabourModuleScreen() {
  const route = useRoute();
  const { selection } = route.params || {};

  return (
    <View style={styles.container}>
      <LabourAssign 
        route={{ params: { 
          selection,
          encodedUserId: 'dGVzdA==' // You might want to get this from your auth context
        }}} 
      />
    </View>
  );
}

// ===============================
// Main Export: Entry Stack
// ===============================
export default function Entry() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="EntryDropdown" 
        component={EntryDropdownScreen} 
        options={{ title: "Select Work" }} 
      />
      <Stack.Screen 
        name="ModuleSelection" 
        component={ModuleSelectionScreen} 
        options={{ title: "Choose Module" }} 
      />
      <Stack.Screen 
        name="MaterialModule" 
        component={MaterialModuleScreen} 
        options={{ title: "Material Dispatch" }} 
      />
      <Stack.Screen 
        name="ExpenseModule" 
        component={ExpenseModuleScreen} 
        options={{ title: "Expense Entry" }} 
      />
      <Stack.Screen 
        name="WorkModule" 
        component={WorkModuleScreen} 
        options={{ title: "Work Management" }} 
      />
      <Stack.Screen 
        name="LabourModule" 
        component={LabourModuleScreen} 
        options={{ title: "Labour Assignment" }} 
      />
    </Stack.Navigator>
  );
}

// ===============================
// Styles
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
  
  // DROPDOWN SECTION STYLES
  dropdownSection: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // DROPDOWN BUTTON STYLES
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 14,
    color: '#374151',
  },
  dropdownButton: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  dropdownButtonEnabled: {
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  dropdownButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    color: '#9ca3af',
  },
  dropdownActiveText: {
    color: '#111827',
  },
  dropdownDisabledText: {
    color: '#6b7280',
  },

  // POPUP MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    backgroundColor: '#14b8a6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalItemText: {
    fontSize: 16,
    color: '#1f2937',
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },

  // Loading Indicator
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

  // SIMPLIFIED MODULE CARD STYLES - No colors, no tap button
  moduleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  moduleCard: {
    width: "48%",
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  moduleCardHeader: {
    height: 45,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  moduleCardTitle: {
    fontWeight: "600",
    textAlign: "center",
    color: "#374151",
    fontSize: 18,
    letterSpacing: 0.5,
  },
  moduleCardIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    backgroundColor: "white",
  },
});
