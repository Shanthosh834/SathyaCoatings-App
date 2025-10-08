import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";

const isCompleted = (r) =>
  parseFloat(r?.completion_value) > 0 &&
  parseFloat(r?.completion_value).toFixed(2) === parseFloat(r?.value).toFixed(2);

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
  onRemarksChange
}) {
  const [showModal, setShowModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);

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