import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import axios from "axios";

const API = "http://103.118.158.127/api";
const Stack = createNativeStackNavigator();

// ===============================
// Inline ModuleCard
// ===============================
const ModuleCard = ({ title, iconName, color = "#1e7a6f", onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={{
      width: "48%", // 2 per row
      marginBottom: 20,
      borderRadius: 10,
      backgroundColor: "#f8fafc",
      shadowColor: "#1e293b",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 4,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      overflow: "hidden",
    }}
  >
    {/* Header */}
    <View
      style={{
        height: 40,
        borderBottomWidth: 1,
        borderColor: "#ccc",
        justifyContent: "center",
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontWeight: "600",
          textAlign: "center",
          color: "#1f2937",
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {title}
      </Text>
    </View>

    {/* Icon */}
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 20,
        backgroundColor: "white",
      }}
    >
      <Ionicons name={iconName} size={36} color={color} />
    </View>

    {/* Footer Button */}
    <View style={{ padding: 10 }}>
      <View
        style={{
          paddingVertical: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: color,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name="arrow-forward-circle-outline"
          size={16}
          color={color}
          style={{ marginRight: 6 }}
        />
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            textAlign: "center",
            color,
          }}
        >
          Open
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ===============================
// Screen 1: Dropdown Selection
// ===============================
function EntryDropdownScreen() {
  const navigation = useNavigation();

  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [workDescs, setWorkDescs] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);

  const [loading, setLoading] = useState(false);

  // modal states
  const [companyModal, setCompanyModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [siteModal, setSiteModal] = useState(false);
  const [workDescModal, setWorkDescModal] = useState(false);

  // fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API}/project/companies`);
        setCompanies(res.data || []);
      } catch (err) {
        console.log("Error fetching companies:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  // fetch projects when company changes
  useEffect(() => {
    if (selectedCompany) {
      const fetchProjects = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API}/project/projects-with-sites`);
          const filtered = res.data.filter(p => p.company_id === selectedCompany.company_id);
          setProjects(filtered);
          setSelectedProject(null);
          setSites([]);
        } catch (err) {
          console.log("Error fetching projects:", err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchProjects();
    }
  }, [selectedCompany]);

  // set sites from project
  useEffect(() => {
    if (selectedProject) {
      setSites(selectedProject.sites || []);
      setSelectedSite(null);
      setWorkDescs([]);
    }
  }, [selectedProject]);

  // fetch work descriptions
  useEffect(() => {
    if (selectedSite) {
      const fetchWorkDescs = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`${API}/material/work-descriptions`, {
            params: { site_id: selectedSite.site_id },
          });
          setWorkDescs(res.data.data || []);
        } catch (err) {
          console.log("Error fetching work descs:", err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchWorkDescs();
    }
  }, [selectedSite]);

  // Reusable DropdownButton
  const DropdownButton = ({ label, value, onPress, disabled }) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontWeight: "600", fontSize: 12 }}>{label}</Text>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 10,
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 6,
          backgroundColor: disabled ? "#f1f1f1" : "#fff",
        }}
      >
        <Text>
          {value
            ? value.company_name || value.project_name || value.site_name
            : `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const DropdownModal = ({ visible, onClose, data, onSelect, displayField }) => (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={{ flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,.5)", padding: 20 }}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={{ backgroundColor: "#fff", borderRadius: 10, maxHeight: "70%", padding: 16 }}>
          <FlatList
            data={data}
            keyExtractor={(item, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" }}
              >
                <Text>{item[displayField]}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f9fafb" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12 }}>Unified Entry</Text>

      <DropdownButton label="Company" value={selectedCompany} onPress={() => setCompanyModal(true)} />
      <DropdownButton label="Project" value={selectedProject} onPress={() => setProjectModal(true)} disabled={!selectedCompany} />
      <DropdownButton label="Site" value={selectedSite} onPress={() => setSiteModal(true)} disabled={!selectedProject} />

      {/* Work Description - navigate directly on select */}
      <DropdownButton
        label="Work Description"
        value={null}
        onPress={() => setWorkDescModal(true)}
        disabled={!selectedSite}
      />

      {loading && <ActivityIndicator size="small" color="tomato" style={{ marginTop: 8 }} />}

      {/* Modals */}
      <DropdownModal visible={companyModal} onClose={() => setCompanyModal(false)} data={companies} onSelect={setSelectedCompany} displayField="company_name" />
      <DropdownModal visible={projectModal} onClose={() => setProjectModal(false)} data={projects} onSelect={setSelectedProject} displayField="project_name" />
      <DropdownModal visible={siteModal} onClose={() => setSiteModal(false)} data={sites} onSelect={setSelectedSite} displayField="site_name" />
      <DropdownModal
        visible={workDescModal}
        onClose={() => setWorkDescModal(false)}
        data={workDescs}
        onSelect={(item) => {
          const selection = {
            company: selectedCompany,
            project: selectedProject,
            site: selectedSite,
            workDesc: item,
          };
          setWorkDescModal(false);
          navigation.navigate("ModuleSelection", { selection });
        }}
        displayField="desc_name"
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
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f9fafb" }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#1e293b" }}>
        Selected: {selection?.workDesc?.desc_name}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        <ModuleCard title="Material" iconName="cube-outline" onPress={() => navigation.navigate("Material", { selection })} />
        <ModuleCard title="Expense" iconName="cash-outline" onPress={() => navigation.navigate("Expense", { selection })} />
        <ModuleCard title="Work" iconName="clipboard-outline" onPress={() => navigation.navigate("Work", { selection })} />
        <ModuleCard title="Labour" iconName="people-outline" onPress={() => navigation.navigate("Labour", { selection })} />
      </View>
    </View>
  );
}

// ===============================
// Main Export: Entry Stack
// ===============================
export default function Entry() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EntryDropdown" component={EntryDropdownScreen} options={{ title: "Select Work" }} />
      <Stack.Screen name="ModuleSelection" component={ModuleSelectionScreen} options={{ title: "Choose Module" }} />
    </Stack.Navigator>
  );
}