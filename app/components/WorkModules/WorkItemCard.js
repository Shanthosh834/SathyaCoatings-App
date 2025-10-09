import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";

const isCompleted = (r) =>
  parseFloat(r?.completion_value) > 0 &&
  parseFloat(r?.completion_value).toFixed(2) === parseFloat(r?.value).toFixed(2);

  const getRemainingTime = (createdAt) => {
  const created = new Date(createdAt);
  const now = new Date();
  const elapsed = now - created;
  const fortyEightHours = 48 * 60 * 60 * 1000;
  const remaining = fortyEightHours - elapsed;

  if (remaining <= 0) return null;

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  return { hours, minutes, seconds, total: remaining };
};

export default function WorkItemCard({
  item,
  selectedDate,
  displayData,
  newWorkData,
  onChange,
  onSubmit,
  submitting,
  materials,   
  site,  
  newRemarksData,
  onRemarksChange,
  onUpdateEntry,
  onFreshHistory
}) {
  const [showModal, setShowModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const [editingEntry, setEditingEntry] = useState(null);
  const [editData, setEditData] = useState({ area_added: "", remarks: "" });
  const [timers, setTimers] = useState({});
  const rate = parseFloat(item.rate) || 0;
  const cumulativeValue = useMemo(
    () => (displayData.cumulative_area * rate).toFixed(2),
    [displayData.cumulative_area, rate]
  );

  const relatedMaterials = useMemo(() => {
    if (!materials || !Array.isArray(materials)) return [];
    return materials.filter(
      (m) =>
        m.site_id === item.site_id &&
        m.pd_id === item.po_number &&
        m.item_name === item.subcategory_name
    );
  }, [materials, item]);

    useEffect(() => {
    const interval = setInterval(() => {
      const newTimers = {};
      displayData.entries.forEach((entry) => {
        if (entry.is_editable) {
          const remaining = getRemainingTime(entry.created_at);
          if (remaining) {
            newTimers[entry.entry_id] = remaining;
          }
        }
      });
      setTimers(newTimers);
    }, 1000);

    return () => clearInterval(interval);
  }, [displayData.entries]);

    const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setEditData({
      area_added: String(entry.area_added || ""),
      remarks: entry.remarks || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditData({ area_added: "", remarks: "" });
  };

  const handleSaveEdit = async () => {
    if (!editData.area_added || !editData.remarks.trim()) {
      alert("Both area and remarks are required");
      return;
    }

    const areaValue = parseFloat(editData.area_added);
    if (isNaN(areaValue) || areaValue < 0) {
      alert("Please enter a valid positive number for area");
      return;
    }

    try {
      // onUpdateEntry(entryId, payload, rec_id)
      await onUpdateEntry(editingEntry.entry_id, {
        area_added: areaValue,
        remarks: editData.remarks.trim()
      }, item.rec_id);

      handleCancelEdit();

      // optional refresh after update
      if (onRefreshHistory) {
        await onRefreshHistory(item.rec_id);
      }
    } catch (error) {
      console.error("Update failed:", error);
    }
  };

    const formatTimer = (timer) => {
    if (!timer) return "";
    return `${timer.hours}h ${timer.minutes}m ${timer.seconds}s`;
  };




  return (
    <View
      style={{
        backgroundColor: '#f8fafc',
        borderWidth: 0.5,
        borderColor: '#333',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontWeight: "900",
          fontSize: 16,
          color: "#167a6f",
          textAlign: "center",
        }}
      >
        {item.subcategory_name}
      </Text>

      <Text
        style={{
          color: "#6b7280",
          fontSize: 14,
          marginBottom: 4,
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        Item: {item.item_id}
      </Text>

      {/* Area Progress */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 13 }}>
          Area :{" "}
          <Text style={{ fontWeight: "700" }}>
            {displayData.cumulative_area.toFixed(2)}
          </Text>
        </Text>
      </View>

      {/* Entries */}
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "600" }}>
          Entries on {selectedDate}:
        </Text>
        {displayData.entries.length === 0 ? (
          <View
            style={{
              backgroundColor: "#f9fafb",
              padding: 8,
              borderRadius: 6,
              marginTop: 4,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderStyle: "dashed",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: "#9ca3af",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              No entries
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "#f8fafc",
              padding: 8,
              borderRadius: 6,
              marginTop: 4,
              borderWidth: 1,
              borderColor: "#e2e8f0",
            }}
          >
            {displayData.entries.map((e) => (
              <Text
                key={e.entry_id}
                style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}
              >
                <Text style={{ fontWeight: "600" }}>
                  {parseFloat(e.area_added || 0).toFixed(2)}
                </Text>{" "}
                added at{" "}
                <Text style={{ color: "#6b7280" }}>
                  {new Date(e.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </Text>
            ))}
            {/* {displayData.entries.map((e) => (
  <View
    key={e.entry_id}
    style={{
      backgroundColor: editingEntry?.entry_id === e.entry_id ? "#fef3c7" : "#fff",
      padding: 8,
      marginBottom: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: editingEntry?.entry_id === e.entry_id ? "#fbbf24" : "#e5e7eb",
    }}
  >
    {editingEntry?.entry_id === e.entry_id ? (
      // Edit Mode
      <View>
        <Text style={{ fontSize: 11, fontWeight: "600", marginBottom: 4, color: "#374151" }}>
          Edit Entry
        </Text>
        
        <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
          Area Added
        </Text>
        <TextInput
          keyboardType="numeric"
          value={editData.area_added}
          onChangeText={(t) => setEditData(prev => ({ ...prev, area_added: t }))}
          placeholder="Area"
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 6,
            padding: 6,
            fontSize: 12,
            backgroundColor: "#fff",
            marginBottom: 6,
          }}
        />

        <Text style={{ fontSize: 10, color: "#6b7280", marginBottom: 2 }}>
          Remarks
        </Text>
        <TextInput
          value={editData.remarks}
          onChangeText={(t) => setEditData(prev => ({ ...prev, remarks: t }))}
          placeholder="Remarks (required)"
          style={{
            borderWidth: 1,
            borderColor: "#d1d5db",
            borderRadius: 6,
            padding: 6,
            fontSize: 12,
            backgroundColor: "#fff",
            marginBottom: 6,
          }}
        />

        <View style={{ flexDirection: "row", gap: 4 }}>
          <TouchableOpacity
            onPress={handleSaveEdit}
            disabled={submitting || !editData.area_added || !editData.remarks.trim()}
            style={{
              flex: 1,
              backgroundColor: (submitting || !editData.area_added || !editData.remarks.trim()) ? "#9ca3af" : "#10b981",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              Update
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleCancelEdit}
            style={{
              flex: 1,
              backgroundColor: "#6b7280",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderRadius: 6,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close-circle" size={14} color="#fff" style={{ marginRight: 4 }} />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ) : (
      // View Mode
      <View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: "#374151" }}>
            <Text style={{ fontWeight: "600" }}>
              {parseFloat(e.area_added || 0).toFixed(2)}
            </Text>{" "}
            added at{" "}
            <Text style={{ color: "#6b7280" }}>
              {new Date(e.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Text>
        </View>

       

        {e.is_editable ? (
          <View>
            {timers[e.entry_id] && (
              <View style={{ 
                backgroundColor: "#fef3c7", 
                padding: 4, 
                borderRadius: 4, 
                marginBottom: 4,
                flexDirection: "row",
                alignItems: "center"
              }}>
                <Ionicons name="time-outline" size={12} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 10, color: "#92400e", fontWeight: "600" }}>
                  expires in: {formatTimer(timers[e.entry_id])}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              onPress={() => handleEditEntry(e)}
              style={{
                backgroundColor: "#3b82f6",
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 6,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="pencil" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>
                Edit Entry
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic", marginTop: 2 }}>
            Edit disabled (48h passed)
          </Text>
        )}
      </View>
    )}
  </View>
))} */}

          </View>
        )}
      </View>

      {/* Completed / Update */}
      {isCompleted(item) ? (
        <View
          style={{
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: "#bbf7d0",
            backgroundColor: "#ecfccb",
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: "#166534", fontWeight: "700", marginRight: 6 }}
          >
            Completed
          </Text>
          <Ionicons name="checkmark-done-circle" size={16} color="#16a34a" />
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: "#1e7a6f",
            borderRadius: 8,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            marginBottom: 15
          }}
        >
          <Ionicons
            name="create-outline"
            size={16}
            color="#fff"
            style={{ marginRight: 6 }}
          />
          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
            Update Area
          </Text>
        </TouchableOpacity>
      )}

      {/* Update Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 10,
              padding: 20,
              width: "100%",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginBottom: 12,
                color: "#111827",
              }}
            >
              Update Work Area
            </Text>

            <Text className="mb-1 text-sm font-medium text-gray-600">
              Enter Work Area
            </Text>
                     
            <TextInput
              keyboardType="numeric"
              value={String(newWorkData[item.rec_id] ?? "")}
              onChangeText={(t) => onChange(item.rec_id, t)}
              placeholder="new work area"
              className="p-3 mb-3 bg-white border border-gray-400 rounded-lg"
            />

            <Text className="mb-1 text-sm font-medium text-gray-600">
              Remarks
            </Text>

            <TextInput
              keyboardType="default"
              value={String(newRemarksData?.[item.rec_id] ?? "")}
              onChangeText={(t) => onRemarksChange(item.rec_id, t)}
              placeholder="Remarks (required)"
              className="p-3 mb-3 bg-white border border-gray-400 rounded-lg"
            />

            <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  marginRight: 10,
                  borderRadius: 8,
                  backgroundColor: "#9ca3af",
                }}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  onSubmit(item);
                  setShowModal(false);
                }}
                disabled={submitting || !newRemarksData?.[item.rec_id]?.trim()}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: (submitting || !newRemarksData?.[item.rec_id]?.trim()) ? "#9ca3af" : "#10b981",
                }}
              >
                <Text style={{ color: "#fff" }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}