// components/common/DropdownSelector.js
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = "http://12345";

export default function DropdownSelector({ onSelectionComplete }) {
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [workDescs, setWorkDescs] = useState([]);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedWorkDesc, setSelectedWorkDesc] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/project/companies`).then(res => {
      setCompanies(res.data || []);
    });
  }, []);

  useEffect(() => {
    if (selectedCompany) {
      axios.get(`${API_BASE}/project/projects-with-sites`)
        .then(res => {
          setProjects(res.data.filter(p => p.company_id === selectedCompany.company_id));
        });
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedProject) {
      setSites(selectedProject.sites || []);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (selectedSite) {
      axios.get(`${API_BASE}/material/work-descriptions`, {
        params: { site_id: selectedSite.site_id },
      }).then(res => {
        setWorkDescs(res.data.data || []);
      });
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedCompany && selectedProject && selectedSite && selectedWorkDesc) {
      // Call parent callback once fully selected
      onSelectionComplete({
        company: selectedCompany,
        project: selectedProject,
        site: selectedSite,
        workDesc: selectedWorkDesc,
      });
    }
  }, [selectedCompany, selectedProject, selectedSite, selectedWorkDesc]);

  // simple dropdown button
  const renderDropdown = (label, value, list, setter, fieldName) => (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontWeight: "600", fontSize: 12, marginBottom: 4 }}>
        {label}
      </Text>
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          borderRadius: 6,
          backgroundColor: "#fff"
        }}
        disabled={!list?.length}
        onPress={() => {
          // Show a quick modal or simple list
          alert(`Implement selection for ${label}`);
        }}
      >
        <Text>{value ? value[fieldName] : `Select ${label}`}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ padding: 12, backgroundColor: "#fff", borderRadius: 8 }}>
      {renderDropdown("Company", selectedCompany, companies, setSelectedCompany, "company_name")}
      {renderDropdown("Project", selectedProject, projects, setSelectedProject, "project_name")}
      {renderDropdown("Site", selectedSite, sites, setSelectedSite, "site_name")}
      {renderDropdown("Work Description", selectedWorkDesc, workDescs, setSelectedWorkDesc, "desc_name")}
    </View>
  );
}