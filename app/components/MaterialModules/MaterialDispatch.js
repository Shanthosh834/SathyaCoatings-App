


import React, { useState, useEffect, useMemo } from "react";
import {
  FlatList,
  View,
  Modal,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import MaterialCard from "./MaterialCard";
import ViewMaterial from "./ViewMaterial";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";

const Material = () => {
  const route = useRoute();
  const { selection } = route.params || {};

  const [dispatchData, setDispatchData] = useState([]);
  const [acknowledgements, setAcknowledgements] = useState({});
  const [ackDetails, setAckDetails] = useState({});

  // loading state
  const [loading, setLoading] = useState(false);

  // error state
  const [error, setError] = useState(null);

  // Modal states
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [acknowledgementModal, setAcknowledgementModal] = useState(false);

  // summary state
  const [showAllSummary, setShowAllSummary] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);

  // material usage
  const [usageModalVisible, setUsageModalVisible] = useState(false);

  // dropdown visible
  const [dropdownsCollapsed, setDropdownsCollapsed] = useState(false);

  const [usageInputs, setUsageInputs] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [usageDetails, setUsageDetails] = useState({});

  // submit state
  const [submitting, setSubmitting] = useState(false);

  // Use selection from Entry.js
  const selectedCompany = selection?.company || null;
  const selectedProject = selection?.project || null;
  const selectedSite = selection?.site || null;
  const selectedWorkDescription = selection?.workDesc || null;

  // fetch usage details 
  const fetchUsageDetails = async (ackId) => {
    try {
      const response = await axios.get(
        `http://103.118.158.127/api/site-incharge/material-usage-details?material_ack_id=${ackId}&date=${selectedDate}`
      );
      setUsageDetails(prev => ({
        ...prev,
        [ackId]: response.data.data
      }));
    } catch (err) {
      console.log("Failed to fetch usage details");
    }
  };

  // Fetch dispatch data when all selections are available
  useEffect(() => {
    if (selectedProject && selectedSite && selectedWorkDescription) {
      const fetchDispatchDetails = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `http://103.118.158.127/api/material/dispatch-details/?pd_id=${selectedProject.project_id}&site_id=${selectedSite.site_id}&desc_id=${selectedWorkDescription.desc_id}`
          );

          const dispatchMap = new Map();
          (response.data.data || []).forEach(dispatch => {
            if (!dispatchMap.has(dispatch.id)) {
              dispatchMap.set(dispatch.id, dispatch);
            }
          });

          const uniqueDispatches = Array.from(dispatchMap.values());
          setDispatchData(uniqueDispatches);

          const ackPromises = uniqueDispatches.map(dispatch =>
            axios.get(
              `http://103.118.158.127/api/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`
            ).catch(err => ({ data: { data: [] } }))
          );

          const ackResponses = await Promise.all(ackPromises);
          const ackMap = {};
          ackResponses.forEach((ackResponse, index) => {
            const dispatchId = uniqueDispatches[index].id;
            const ackData = ackResponse.data.data[0] || null;
            ackMap[dispatchId] = ackData;
          });
          setAckDetails(ackMap);
          setError(null);
        } catch (err) {
          setError("Failed to fetch dispatch or acknowledgement details");
          Alert.alert("Error", "Failed to fetch dispatch or acknowledgement details");
        } finally {
          setLoading(false);
        }
      };
      fetchDispatchDetails();
    }
  }, [selectedProject, selectedSite, selectedWorkDescription]);

  const handleAcknowledge = async (dispatchId) => {
    const ackData = acknowledgements[dispatchId];
    if (!ackData) return;

    try {
      const response = await axios.post("http://103.118.158.127/api/site-incharge/acknowledge-material", {
        material_dispatch_id: parseInt(dispatchId),
        overall_quantity: ackData.overall_quantity !== "" ? parseInt(ackData.overall_quantity) : null,
        remarks: ackData.remarks || null,
      });
      Alert.alert("Success", response.data.message);
      
      // Clear the acknowledgement input for this item
      setAcknowledgements(prev => {
        const newAck = { ...prev };
        delete newAck[dispatchId];
        return newAck;
      });
      
      // Refresh acknowledgement data for the specific dispatch
      const responseRefresh = await axios.get(
        `http://103.118.158.127/api/site-incharge/acknowledgement-details?material_dispatch_id=${dispatchId}`
      );
      setAckDetails(prev => ({
        ...prev,
        [dispatchId]: responseRefresh.data.data[0] || null
      }));
      
      setAcknowledgementModal(false);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save acknowledgement");
    }
  };

  const handleAckInputChange = (dispatchId, field, value) => {
    setAcknowledgements(prev => ({
      ...prev,
      [dispatchId]: {
        ...prev[dispatchId],
        [field]: value
      }
    }));
  };

  // material acknowledgement
  const openAcknowledgementModal = (item) => {
    setSelectedItem(item);
    // Initialize with existing acknowledgement data or empty strings
    const existingAck = ackDetails[item.id] && ackDetails[item.id].acknowledgement;
    setAcknowledgements(prev => ({
      ...prev,
      [item.id]: {
        overall_quantity: existingAck ? existingAck.overall_quantity?.toString() || "" : "",
        remarks: existingAck ? existingAck.remarks || "" : ""
      }
    }));
    setAcknowledgementModal(true);
  };

  const openUsageModal = (item) => {
    console.log("Opening usage modal for:", item.item_name);
    setSelectedItem(item);
    
    const ackData = ackDetails[item.id];
    if (ackData && ackData.acknowledgement) {
      fetchUsageDetails(ackData.acknowledgement.id);
    }

    setUsageInputs(prev => ({
      ...prev,
      [item.id]: prev[item.id] || { overall_qty: "", remarks: "" }
    }));
    setUsageModalVisible(true);
  };

  // changing input
  const handleInputChange = (compositeKey, field, value) => {
    setUsageInputs(prev => ({
      ...prev,
      [compositeKey]: {
        ...prev[compositeKey],
        [field]: value
      }
    }));
  };
  
  const handleSaveUsage = async (dispatchId) => {
    const ackData = ackDetails[dispatchId];
    if (!ackData || !ackData.acknowledgement) {
      Alert.alert("Error", "No acknowledgement found for this item");
      return;
    }
    
    const ackId = ackData.acknowledgement.id;
    const usageData = usageInputs[dispatchId];
    
    if (!usageData || !usageData.overall_qty) {
      Alert.alert("Error", "Please enter usage quantity");
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await axios.post("http://103.118.158.127/api/site-incharge/save-material-usage", {
        material_ack_id: parseInt(ackId),
        entry_date: selectedDate,
        overall_qty: parseInt(usageData.overall_qty),
        remarks: usageData.remarks || null,
        created_by: 1
      });

      Alert.alert("Success", response.data.message);
      
      // Refresh usage details
      fetchUsageDetails(ackId);
      
      // Clear inputs
      setUsageInputs(prev => ({ ...prev, [dispatchId]: {} }));
      
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Failed to save material usage");
    } finally {
      setSubmitting(false);
    }
  };

  const formatItemAndRatios = (dispatch) => {
    const ratios = [dispatch.comp_ratio_a, dispatch.comp_ratio_b];
    if (dispatch.comp_ratio_c !== null) {
      ratios.push(dispatch.comp_ratio_c);
    }
    return `${dispatch.item_name} (${ratios.join(':')})`;
  };

  return (
    <View className="flex-1 p-3 bg-gray-100">
      
     
        <View className="px-2 py-2 mb-4 bg-white rounded-xl border-[0.5px] ">
          {/* Display selected values from Entry.js - Read-only */}
       
            <View className="rounded-lg ">
              {/* Grid container */}
              <View className="flex-row flex-wrap">
                {/* Company */}
                <View className="w-1/2 pr-2 mb-1">
                  <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                    Company
                  </Text>
                  <Text className="text-xs font-semibold text-gray-800">
                    {selectedCompany?.company_name || "—"}
                  </Text>
                </View>

                {/* Project */}
                <View className="w-1/2 pl-2 mb-3">
                  <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                    Project
                  </Text>
                  <Text className="text-xs font-semibold text-gray-800">
                    {selectedProject?.project_name || "—"}
                  </Text>
                </View>

                {/* Site */}
                <View className="w-1/2 pr-2">
                  <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                    Site
                  </Text>
                  <Text className="text-xs font-semibold text-gray-800">
                    {selectedSite?.site_name || "—"}
                  </Text>
                </View>

                {/* Work */}
                <View className="w-1/2 pl-2">
                  <Text className="text-[10px] uppercase tracking-wide text-gray-500">
                    Work
                  </Text>
                  <Text className="text-xs font-semibold text-gray-800">
                    {selectedWorkDescription?.desc_name || "—"}
                  </Text>
                </View>
              </View>
            </View>
        </View>
     
        
          {dispatchData.length > 0 && (
            <TouchableOpacity
              onPress={() => setSummaryModalVisible(true)}
              className="px-4 py-3 mb-3 bg-[#1e7a6f] rounded-lg"
            >
              <Text className="text-base font-semibold text-center text-white">
                Acknowledgement status
              </Text>
            </TouchableOpacity>
          )}

          {/* <TouchableOpacity
            onPress={() => setDropdownsCollapsed(false)}
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
              backgroundColor: "#1e7a6f",
              padding: 14,
              borderRadius: 50,
              elevation: 5,
              zIndex: 999
            }}
          >
            <Ionicons name="list-circle" size={30} color="#fff" />
          </TouchableOpacity> */}
        
    

      {/* Acknowledgement Modal */}
      <Modal visible={acknowledgementModal} transparent animationType="fade">
        <View className="items-center justify-center flex-1 p-5 bg-black/50">
          <View className="w-full max-h-[80%] p-5 bg-white rounded-2xl">
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="p-3 mb-4 rounded-lg bg-gray-50">
                  <Text className="mb-2 text-base font-semibold text-gray-800">
                    {formatItemAndRatios(selectedItem)}
                  </Text>

                  {/* Dispatched Quantities */}
                  <Text className="mb-2 text-sm font-medium text-gray-700">
                    Dispatched Quantities:
                  </Text>
                  <View className="space-y-1">
                    {selectedItem.comp_a_qty !== null && (
                      <Text className="text-sm text-gray-600">
                        <Text className="font-medium">Comp A:</Text> {selectedItem.comp_a_qty}
                      </Text>
                    )}
                    {selectedItem.comp_b_qty !== null && (
                      <Text className="text-sm text-gray-600">
                        <Text className="font-medium">Comp B:</Text> {selectedItem.comp_b_qty}
                      </Text>
                    )}
                    {selectedItem.comp_c_qty !== null && (
                      <Text className="text-sm text-gray-600">
                        <Text className="font-medium">Comp C:</Text> {selectedItem.comp_c_qty}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Show existing acknowledgement OR input form */}
                {ackDetails[selectedItem.id] && ackDetails[selectedItem.id].acknowledgement ? (
                  <View className="p-3 rounded-lg bg-green-50">
                    <Text className="mb-1 text-base font-semibold text-green-800">
                      Acknowledgement Details
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Overall Quantity: {ackDetails[selectedItem.id].acknowledgement.overall_quantity} (
                      {ackDetails[selectedItem.id].acknowledgement.overall_quantity} litre received)
                    </Text>
                    <Text className="mt-1 text-sm text-gray-700">
                      Remarks: {ackDetails[selectedItem.id].acknowledgement.remarks || "None"}
                    </Text>
                  </View>
                ) : (
                  <View className="space-y-3">
                    <View>
                      <Text className="mb-1 text-sm font-medium text-gray-600">
                        Overall Quantity Received
                      </Text>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="Enter overall quantity received"
                        value={acknowledgements[selectedItem.id]?.overall_quantity || ""}
                        onChangeText={(value) =>
                          handleAckInputChange(selectedItem.id, "overall_quantity", value)
                        }
                        className="p-3 bg-white border border-gray-400 rounded-lg"
                        maxLength={10}
                      />
                    </View>

                    <View>
                      <Text className="mb-1 text-sm font-medium text-gray-600">
                        Remarks 
                      </Text>
                      <TextInput
                        placeholder="Add any remarks about the received material"
                        value={acknowledgements[selectedItem.id]?.remarks || ""}
                        onChangeText={(value) =>
                          handleAckInputChange(selectedItem.id, "remarks", value)
                        }
                        className="p-3 bg-white border border-gray-400 rounded-lg"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                      />
                    </View>

                    <TouchableOpacity
                      onPress={() => handleAcknowledge(selectedItem.id)}
                      disabled={
                        !acknowledgements[selectedItem.id] ||
                        (!acknowledgements[selectedItem.id].overall_quantity &&
                          !acknowledgements[selectedItem.id].remarks)
                      }
                      className={`px-4 py-3 rounded-lg mt-2 ${
                        !acknowledgements[selectedItem.id] ||
                        (!acknowledgements[selectedItem.id].overall_quantity &&
                          !acknowledgements[selectedItem.id].remarks)
                          ? "bg-gray-300"
                          : "bg-indigo-600"
                      }`}
                    >
                      <Text className="font-semibold text-center text-white">
                        Save Acknowledgement
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setAcknowledgementModal(false)}
              className="py-3 mt-4 bg-gray-400 rounded-lg"
            >
              <Text className="font-semibold text-center text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={usageModalVisible} transparent animationType="fade">
        <View className="items-center justify-center flex-1 p-5 bg-black/50">
          <View className="w-full max-h-[80%] p-5 bg-white rounded-2xl">
            {selectedItem && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="">
                  <Text className="mb-3 text-lg font-extrabold text-gray-800 ">
                    Usage for {selectedItem.item_name}
                  </Text>
                </View>

                {/* Acknowledged Quantities Section */}
                {ackDetails[selectedItem.id]?.acknowledgement && (
                  <View className="p-3 mb-4 rounded-lg ">
                    <Text className="mb-2 text-sm font-semibold text-blue-800">
                      Acknowledged Quantities
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Overall: {ackDetails[selectedItem.id].acknowledgement.overall_quantity} (
                      {ackDetails[selectedItem.id].acknowledgement.remarks || 'No remarks'})
                    </Text>
                  </View>
                )}

                {/* Progress Section */}
                {ackDetails[selectedItem.id]?.acknowledgement && usageDetails[ackDetails[selectedItem.id].acknowledgement.id] && (
                  <View className="p-3 mb-4 border rounded-lg">
                    <Text className="mb-2 text-sm font-semibold text-green-800">
                      Progress as of {selectedDate}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Used: {usageDetails[ackDetails[selectedItem.id].acknowledgement.id].cumulative?.overall_qty || 0} / {ackDetails[selectedItem.id].acknowledgement.overall_quantity}
                    </Text>
                  </View>
                )}

                {/* Today's Entries */}
                {ackDetails[selectedItem.id]?.acknowledgement && usageDetails[ackDetails[selectedItem.id].acknowledgement.id]?.entries?.length > 0 && (
                  <View className="p-3 mb-4 rounded-lg ">
                    <Text className="mb-2 text-sm font-semibold text-gray-800">
                      Entries on {selectedDate}
                    </Text>
                    {usageDetails[ackDetails[selectedItem.id].acknowledgement.id].entries.map((entry, index) => (
                      <View key={index} className="mb-2">
                        <Text className="text-xs font-medium text-gray-600">
                          {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:
                        </Text>
                        <Text className="text-sm text-gray-700">
                          Overall: {entry.overall_qty} ({entry.remarks || 'No remarks'})
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Input Section */}
                <Text className="mb-1 text-sm font-medium text-gray-600">
                  Used Quantity
                </Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="Enter used quantity"
                  value={usageInputs[selectedItem.id]?.overall_qty || ""}
                  onChangeText={(value) => handleInputChange(selectedItem.id, 'overall_qty', value)}
                  className="p-3 mb-3 bg-white border border-gray-400 rounded-lg"
                />

                <Text className="mb-1 text-sm font-medium text-gray-600">
                  Remarks
                </Text>
                <TextInput
                  placeholder="Enter remarks"
                  value={usageInputs[selectedItem.id]?.remarks || ""}
                  onChangeText={(value) => handleInputChange(selectedItem.id, 'remarks', value)}
                  className="p-3 mb-3 bg-white border border-gray-400 rounded-lg"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  onPress={() => handleSaveUsage(selectedItem.id)}
                  disabled={submitting || !usageInputs[selectedItem.id]?.overall_qty}
                  className={`px-4 py-3 mt-2 rounded-lg ${
                    submitting || !usageInputs[selectedItem.id]?.overall_qty 
                      ? "bg-gray-300" 
                      : "bg-indigo-600"
                  }`}
                >
                  <Text className="font-semibold text-center text-white">
                    {submitting ? "Saving..." : "Save Usage"}
                  </Text>
                </TouchableOpacity>

              </ScrollView>
            )}

            <TouchableOpacity
              onPress={() => setUsageModalVisible(false)}
              className="py-3 mt-4 bg-gray-400 rounded-lg"
            >
              <Text className="font-semibold text-center text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {loading && (
        <View className="items-center justify-center flex-1">
          <Text className="text-base text-gray-600">Loading...</Text>
        </View>
      )}
      
      {error && (
        <View className="items-center justify-center flex-1">
          <Text className="text-base text-red-600">{error}</Text>
        </View>
      )}

      {/* All Acknowledgements Summary */}
      {showAllSummary && (
        <View className="p-4 mb-4 bg-gray-100 rounded-lg">
          <Text className="mb-2 text-base font-bold text-gray-800">
            Acknowledgement Summary
          </Text>
          {dispatchData.map((item) => {
            const ack = ackDetails[item.id]?.acknowledgement;
            if (!ack) return null;
            return (
              <View
                key={item.id}
                className="p-3 mb-2 bg-white border border-gray-200 rounded-lg"
              >
                <Text className="text-sm font-medium text-gray-700">
                  {item.item_name}
                </Text>
                <Text className="text-sm text-gray-600">
                  Overall Quantity: {ack.overall_quantity}
                </Text>
                {ack.remarks ? (
                  <Text className="mt-1 text-xs text-gray-500">
                    Remarks: {ack.remarks}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={summaryModalVisible} transparent animationType="fade">
        <View className="items-center justify-center flex-1 p-5 bg-black/50">
          <View className="w-full max-h-[80%] bg-white rounded-2xl p-5">
            <Text className="mb-4 text-lg font-bold text-center text-gray-800">
              Acknowledgement Summary
            </Text>

            <ScrollView showsVerticalScrollIndicator={true}>
              {dispatchData.map((item) => {
                const ack = ackDetails[item.id]?.acknowledgement;
                if (!ack) return null;
                return (
                  <View
                    key={item.id}
                    className="p-3 mb-3 bg-gray-100 border border-gray-200 rounded-lg"
                  >
                    <Text className="text-sm font-semibold text-gray-700">
                      {item.item_name}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      Overall Quantity: {ack.overall_quantity}
                    </Text>
                    {ack.remarks ? (
                      <Text className="mt-1 text-xs text-gray-500">
                        Remarks: {ack.remarks}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setSummaryModalVisible(false)}
              className="py-3 mt-4 bg-gray-400 rounded-lg"
            >
              <Text className="font-semibold text-center text-white">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Materials List */}
      {!selectedCompany || !selectedProject || !selectedSite || !selectedWorkDescription ? (
        <View className="items-center justify-center flex-1">
          <Text className="text-base text-center text-gray-500">
            No work selection found. Please go back and select work details.
          </Text>
        </View>
      ) : dispatchData.length === 0 && !loading ? (
        <View className="items-center justify-center flex-1">
          <Text className="text-base text-center text-gray-500">
            No materials found for the selected work description.
          </Text>
        </View>
      ) : (
        <FlatList
          data={dispatchData}
          keyExtractor={(item) => item.id?.toString()}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <MaterialCard
              itemId={item.id}
              itemName={item.item_name}
              isAcknowledged={ackDetails[item.id] && ackDetails[item.id].acknowledgement ? true : false}
              onView={() => {
                setSelectedItem(item);
                setModalVisible(true);
              }}
              onUpdate={() => {
                openAcknowledgementModal(item);
              }}
              onUsage={() => {
                openUsageModal(item); 
              }}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* View Material Modal */}
      <ViewMaterial
        visible={modalVisible}
        materialName={selectedItem?.item_name}
        item={selectedItem?.id}
        selectedItemData={selectedItem}
        allDispatchedMaterials={dispatchData}
        ackDetails={ackDetails}
        onClose={() => setModalVisible(false)}
        onUpdate={() => {
          setModalVisible(false);
          openAcknowledgementModal(selectedItem);
        }}
        onAcknowledge={() => {
          setModalVisible(false);
          openAcknowledgementModal(selectedItem);
        }}
        isAcknowledged={selectedItem && ackDetails[selectedItem.id] && ackDetails[selectedItem.id].acknowledgement ? true : false}
      />
    </View>
  );
};

export default Material;