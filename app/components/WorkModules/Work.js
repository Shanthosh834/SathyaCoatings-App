import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TextInput } from "react-native-paper";
import { useRoute } from "@react-navigation/native";
import axios from "axios";
import WorkItemCard from "./WorkItemCard";
import DateTimePicker from "@react-native-community/datetimepicker";

const API = "http://10.140.205.28:5000";

const formatDate = (d) =>
  d instanceof Date ? d.toISOString().split("T")[0] : d;

export default function Work() {
  const route = useRoute();
  const { selection } = route.params || {};
  
  // Move today to a stable reference to avoid useEffect dependencies issues
  const today = useMemo(() => formatDate(new Date()), []);

  // Remove the duplicate dropdowns state since we're getting it from Entry.js
  const [searchQuery, setSearchQuery] = useState("");
  const [works, setWorks] = useState([]);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [newWorkData, setNewWorkData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(today);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [historyData, setHistoryData] = useState({});
  const [materials, setMaterials] = useState([]);

  // dropdown visible
  const [dropdownsCollapsed, setDropdownsCollapsed] = useState(false);

  const [workDescLoading, setWorkDescLoading] = useState(false);

 const [newRemarksData, setNewRemarksData] = useState({});


  const userId = 1;

  // Use the selected work description from Entry.js
  const selectedWorkDesc = selection?.workDesc?.desc_name || null;
  
  const selectedWork = useMemo(() => {
    return selection?.site ? {
      id: selection.site.site_id,
      name: selection.site.site_name,
      po_number: selection.site.po_number || null,
    } : null;
  }, [selection]);

  // Reckoner
  const fetchReckonerData = async (preserveSelections = false) => {
    if (!selectedWork) return;
    try {
      setLoadingItems(true);
      const res = await axios.get(`${API}/reckoner/reckoner/`);
      const data =
        res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
      const siteFiltered = data.filter(
        (item) => item.site_id === selectedWork.id
      );
      setItems(siteFiltered);

      const uniqueCategories = [
        ...new Set(siteFiltered.map((i) => i.category_name)),
      ];
      setCategories(uniqueCategories);

      if (!preserveSelections) {
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);
          // If we have the work description from Entry.js, filter by it
          if (selectedWorkDesc) {
            const worksForFirstCat = siteFiltered.filter(
              (i) => i.category_name === uniqueCategories[0] && 
                     i.work_descriptions === selectedWorkDesc
            );
            setFilteredItems(worksForFirstCat);
          } else {
            setFilteredItems([]);
          }
        } else {
          setSelectedCategory(null);
          setFilteredItems([]);
        }
        setHistoryData({});
      }
    } catch (err) {
      console.log(err);
      alert("Failed to fetch reckoner data");
    } finally {
      setLoadingItems(false);
    }
  };

  const categoryFilteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    return items.filter((item) => item.category_name === selectedCategory);
  }, [items, selectedCategory]);

  useEffect(() => {
    if (!selectedCategory || !selectedWorkDesc) {
      setFilteredItems([]);
    } else {
      const workFiltered = categoryFilteredItems.filter(
        (item) => item.work_descriptions === selectedWorkDesc
      );
      setFilteredItems(workFiltered);
    }
  }, [categoryFilteredItems, selectedWorkDesc, selectedCategory]);

  const fetchHistoryData = async (rec_id, dateStr) => {
    try {
      const res = await axios.get(
        `${API}/site-incharge/completion-entries`,
        {
          params: { rec_id, date: dateStr },
        }
      );
      if (res.data.status === "success") {
        setHistoryData((prev) => ({
          ...prev,
          [rec_id]: res.data.data,
        }));
      } else {
        console.log("History fetch failed for", rec_id, res.data);
       }
    } catch (err) {
      console.log(
        "Entries fetch error:",
        rec_id,
        err?.response?.data || err.message
      );
    }
  };

  // Fetch materials for selected site
  const fetchMaterials = async () => {
    if (!selectedWork) return;
    try {
      const res = await axios.get(`${API}/material/dispatch-details`, {
        params: {
          pd_id: selectedWork.po_number,
          site_id: selectedWork.id,
        },
      });
      if (res.data.success && Array.isArray(res.data.data)) {
        setMaterials(res.data.data);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.log("Material fetch error:", err.response?.data || err.message);
      setMaterials([]);
    }
  };

  // Initialize data when component loads with selection from Entry.js
  useEffect(() => {
    if (selectedWork) {
      fetchReckonerData();
      fetchMaterials();
      setSelectedDate(today);
    }
  }, [selectedWork, today]);

  useEffect(() => {
    if (!filteredItems.length || !selectedDate) return;
    filteredItems.forEach((r) => fetchHistoryData(r.rec_id, selectedDate));
    setNewWorkData({});
  }, [selectedDate, filteredItems]);

  const handleNewWorkChange = (rec_id, value) => {
    setNewWorkData((prev) => ({ ...prev, [rec_id]: value }));
  };

  const handleNewRemarksChange = (rec_id, value) => {
  setNewRemarksData((prev) => ({ ...prev, [rec_id]: value }));
};

  const handleSubmit = async (item) => {
  try {
    setSubmitting(true);
    const addition = parseFloat(newWorkData[item.rec_id]) || 0;
    const remarks = newRemarksData[item.rec_id]?.trim();
    
    // Add remarks validation
    if (!remarks || remarks === '') {
      alert("Remarks are required");
      setSubmitting(false);
      return;
    }
    
    const alreadyCompleted = parseFloat(item.area_completed) || 0;
    const total = alreadyCompleted + addition;

    if (addition < 0) {
      alert("Area cannot be negative");
      setSubmitting(false);
      return;
    }

    const rate = parseFloat(item.rate) || 0;
    const value = parseFloat((addition * rate).toFixed(2));

    const payload = {
      rec_id: item.rec_id,
      area_added: addition,
      rate,
      value,
      created_by: parseInt(userId, 10),
      entry_date: selectedDate,
      remarks, // Add remarks to payload
    };

    await axios.post(`${API}/site-incharge/completion-status`, payload);

    alert("Entry added successfully");

    setNewWorkData((prev) => ({ ...prev, [item.rec_id]: "" }));
    setNewRemarksData((prev) => ({ ...prev, [item.rec_id]: "" })); // Clear remarks

    await fetchReckonerData(true);
    await fetchHistoryData(item.rec_id, selectedDate);
  } catch (err) {
    console.log("Update error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Failed to add entry");
  } finally {
    setSubmitting(false);
  }
};

  const displayedItems = filteredItems.filter((item) =>
    (item.item_name || item.work_descriptions || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const groupedItems = displayedItems.reduce((acc, item) => {
    if (!acc[item.category_name]) acc[item.category_name] = [];
    acc[item.category_name].push(item);
    return acc;
  }, {});

  const handleCategorySelect = (category) => {
    setCategoryLoading(true);
    setSelectedCategory(category);
    setTimeout(() => setCategoryLoading(false), 300);
  };

  return (
    <>
      {!dropdownsCollapsed && (
        <View style={{ margin: 10, padding: 8, paddingTop: 0, borderRadius: 8}} >
          
          <View className="px-2 py-2 mb-4 bg-white rounded-xl border-[0.5px]">
                        {/* Grid container */}
                        <View className="flex-row flex-wrap">
                          {/* Company */}
                          <View className="w-1/2 pr-2 mb-1">
                            <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                              Company
                            </Text>
                            <Text className="text-xs font-semibold text-gray-800">
                               {selection?.company?.company_name || "Not selected"}
                            </Text>
                          </View>
          
                          {/* Project */}
                          <View className="w-1/2 pl-2 mb-3">
                            <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                              Project
                            </Text>
                            <Text className="text-xs font-semibold text-gray-800">
                               {selection?.project?.project_name || "Not selected"}
                            </Text>
                          </View>
          
                          {/* Site */}
                          <View className="w-1/2 pr-2">
                            <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                              Site
                            </Text>
                            <Text className="text-xs font-semibold text-gray-800">
                               {selection?.project?.project_name || "Not selected"}
                            </Text>
                          </View>
          
                          {/* Work */}
                          <View className="w-1/2 pl-2">
                            <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                              Work
                            </Text>
                            <Text className="text-xs font-semibold text-gray-800">
                               {selection?.workDesc?.desc_name || "Not selected"}
                            </Text>
                          </View>
                        </View>
                      </View>

          
          <View style={{ marginTop: 0 }}>
            {categories.length > 0 && (
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 4, marginBottom: 10 }}>
                  {categories.map((category, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleCategorySelect(category)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        backgroundColor: selectedCategory === category ? "#1e7a6f" : "#f0f0f0",
                        borderRadius: 20,
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ color: selectedCategory === category ? "#fff" : "#000" }} className="text-sm">
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={{ marginBottom: 6, flexDirection: "row", alignItems: "center", width: 120}}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(true)}
                    style={{
                      borderWidth: 0.5,
                      // borderColor: "#ccc",
                      borderRadius: 6,
                      paddingHorizontal: 2,
                      backgroundColor: "#fff",
                      flex: 1,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text className="p-2 text-sm font-semibold tracking-wider">
                      {selectedDate
                        ? new Date(selectedDate).toLocaleDateString()
                        : "Select Date"}
                    </Text>
                    <Ionicons name="calendar" size={20} color="#888" />
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate ? new Date(selectedDate) : new Date()}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      maximumDate={new Date()}
                      onChange={(event, date) => {
                        setShowDatePicker(false);
                        if (date) setSelectedDate(formatDate(date));
                      }}
                    />
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Items List */}
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 10 }}>
        {selectedWork ? (
          !selectedCategory ? (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <Ionicons name="list-outline" size={48} color="#ccc" />
              <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
                Please select a category to continue
              </Text>
            </View>
          ) : !selectedWorkDesc ? (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <Ionicons name="document-text-outline" size={48} color="#ccc" />
              <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
                Please select work description to view items
              </Text>
            </View>
          ) : loadingItems || categoryLoading || workDescLoading ? (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#1e7a6f" />
              <Text style={{ marginTop: 10, color: "#1e7a6f" }}>
                {loadingItems ? "Loading items..." : 
                 categoryLoading ? "Loading category..." : 
                 "Loading work descriptions..."}
              </Text>
            </View>
          ) : Object.keys(groupedItems).length ? (
            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
              {Object.keys(groupedItems).map((category, idx) => (
                <View key={idx} style={{ marginBottom: 20 }}>
                  {groupedItems[category]?.map((item) => {
                    const displayData =
                      historyData[item.rec_id] && typeof historyData[item.rec_id] === "object"
                        ? {
                            cumulative_area: parseFloat(historyData[item.rec_id]?.cumulative_area) || 0,
                            entries: Array.isArray(historyData[item.rec_id]?.entries)
                              ? historyData[item.rec_id].entries
                              : [],
                          }
                        : {
                            cumulative_area: parseFloat(item.area_completed) || 0,
                            entries: [],
                          };

                    return (
                      <WorkItemCard
                        key={item.rec_id}
                        item={item}
                        selectedDate={selectedDate}
                        displayData={displayData}
                        newWorkData={newWorkData}
                        newRemarksData={newRemarksData}
                        onChange={handleNewWorkChange}
                        onRemarksChange={handleNewRemarksChange}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        materials={materials}
                        site={selectedWork}
                      />
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ marginTop: 50, alignItems: "center" }}>
              <Ionicons name="document-outline" size={48} color="#ccc" />
              <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
                No items found for selected category
              </Text>
            </View>
          )
        ) : (
          <View style={{ marginTop: 50, alignItems: "center" }}>
            <Ionicons name="business-outline" size={48} color="#ccc" />
            <Text style={{ color: "#888", fontSize: 16, marginTop: 10 }}>
              No work selection found. Please go back and select work details.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}