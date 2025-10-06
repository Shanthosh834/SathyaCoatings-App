import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Modal, Platform, TextInput, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const LabourCard = ({ itemId, onView, itemName, phone, status, onUsage, totalShifts = 0 }) => {
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Get status color and icon based on attendance status
  const getStatusDisplay = (status) => {
    switch(status) {
      case 'present':
        return { color: '#059669', icon: 'checkmark-circle', text: 'Present' };
      case 'absent':
        return { color: '#dc2626', icon: 'close-circle', text: 'Absent' };
      case 'on_leave':
        return { color: '#d97706', icon: 'time', text: 'On Leave' };
      default:
        return { color: '#6b7280', icon: 'help-circle', text: 'Not Marked' };
    }
  };

  const statusDisplay = getStatusDisplay(status);

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAttendanceSubmit = () => {
    // Validation
    if (!selectedShift.trim()) {
      Alert.alert('Validation Error', 'Please enter shift hours');
      return;
    }

    // Validate numeric input
    const shiftValue = parseFloat(selectedShift.trim());
    if (isNaN(shiftValue) || shiftValue <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid positive number for shift hours');
      return;
    }

    if (!remarks.trim()) {
      Alert.alert('Validation Error', 'Please enter remarks');
      return;
    }

    const attendanceData = {
      labourId: itemId,
      labourName: itemName,
      date: selectedDate.toISOString().split('T')[0],
      shift: shiftValue,
      status: attendanceStatus,
      remarks: remarks.trim(),
      timestamp: new Date().toISOString()
    };
    
    console.log(`Marking attendance for ${itemName} (ID: ${itemId}):`, attendanceData);
    
    if (onUsage) {
      onUsage(attendanceData);
    }

    // Reset form
    setSelectedShift('');
    setAttendanceStatus('');
    setRemarks('');
    setShowAttendanceModal(false);
    
    Alert.alert('Success', `Attendance marked for ${itemName}!\nCurrent shift: ${shiftValue} hours\nNew total: ${(totalShifts + shiftValue).toFixed(1)} hours`);
  };

  const clearForm = () => {
    setSelectedShift('');
    setAttendanceStatus('');
    setRemarks('');
    setSelectedDate(new Date());
  };

  return (
    <>
      <TouchableOpacity
        onPress={onView}
        style={{
          width: '48%',
          marginBottom: 20,
          marginHorizontal: '1%',
          borderRadius: 10,
          backgroundColor: '#f8fafc',
          shadowColor: '#6366f1',
          shadowOffset: {
            width: 0,
            height: 8,
          },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
          borderWidth: 0.5,
          borderColor: '#333',
          overflow: 'hidden'
        }}
      >
        {/* Header - Show Labour ID */}
        <View style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: '#f8fafc',
          position: 'relative',
          height: 48,
          borderBottomWidth: 1,
          borderColor: "#ccc",
          elevation: 1,
        }}>
          <Text style={{
            fontWeight: '900',
            textAlign: 'center',
            color: '#1f2937',
            fontSize: 12,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}>
            ID: {itemId}
          </Text>
        </View>

        {/* Card Content - Reduced padding */}
        <View style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
          paddingVertical: 12,
          marginHorizontal: 8,
          marginTop: 8,
          borderRadius: 16
        }}>
          {/* Labour Icon */}
          <Ionicons name="person-outline" size={30} color="#333333" />
          
          {/* Labour Name */}
          <Text style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#1f2937',
            textAlign: 'center',
            marginTop: 6,
            marginBottom: 2,
          }}>
            {itemName || 'Unknown'}
          </Text>

          {/* Phone Number */}
          {phone && (
            <Text style={{
              fontSize: 11,
              color: '#6b7280',
              textAlign: 'center',
              marginBottom: 6,
            }}>
              {phone}
            </Text>
          )}

          {/* Status Badge */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: statusDisplay.color + '20',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}>
            <Ionicons 
              name={statusDisplay.icon} 
              size={11} 
              color={statusDisplay.color} 
              style={{ marginRight: 4 }}
            />
            <Text style={{
              fontSize: 9,
              fontWeight: '600',
              color: statusDisplay.color,
              textTransform: 'uppercase',
            }}>
              {statusDisplay.text}
            </Text>
          </View>
        </View>

        {/* Footer - Reduced padding */}
        <View style={{ padding: 8 }}>
          <TouchableOpacity
            style={{
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: "#16786f",
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
            }}
            onPress={() => setShowAttendanceModal(true)}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color="#fff"
              style={{ marginRight: 6 }}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: "600",
              textAlign: "center",
              color: "#fff"
            }}>
              Usage
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Attendance Modal */}
      <Modal
        visible={showAttendanceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttendanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Ionicons name="clipboard-outline" size={32} color="#16786f" />
                <Text style={styles.modalTitle}>
                  Mark Attendance
                </Text>
                <Text style={styles.modalSubtitle}>
                  {itemName} (ID: {itemId})
                </Text>
              </View>

              {/* Date Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Attendance Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={styles.datePickerButton}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" style={{ marginRight: 12 }} />
                  <Text style={styles.datePickerText}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}

              {/* Numeric Shift Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Shift Hours <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter shift hours (e.g., 1, 2, 1.5)"
                  placeholderTextColor="#9ca3af"
                  value={selectedShift}
                  onChangeText={setSelectedShift}
                  keyboardType="numeric"
                />
                <Text style={styles.inputHint}>
                  Examples: 1, 2, 1.5, 0.5 (hours worked)
                </Text>
              </View>

              {/* Remarks Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Remarks <Text style={{ color: '#dc2626' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter attendance remarks, notes, or any special observations..."
                  placeholderTextColor="#9ca3af"
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {/* Secondary Actions Row */}
                <View style={styles.secondaryButtonRow}>
                  <TouchableOpacity
                    onPress={clearForm}
                    style={styles.secondaryButton}
                  >
                    <Ionicons 
                      name="refresh-outline" 
                      size={16} 
                      color="#64748b" 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.secondaryButtonText}>
                      Clear
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setShowAttendanceModal(false)}
                    style={styles.secondaryButton}
                  >
                    <Ionicons 
                      name="close-outline" 
                      size={16} 
                      color="#64748b" 
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.secondaryButtonText}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Primary Action */}
                <TouchableOpacity
                  onPress={handleAttendanceSubmit}
                  style={styles.submitButton}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={18} 
                    color="white" 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitButtonText}>
                    Mark Attendance
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  datePickerText: {
    fontSize: 16,
    color: '#1f2937',
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1f2937',
    textAlign: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    textAlign: 'left',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  submitButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#16786f',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#16786f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    letterSpacing: 0.5,
  },
});

export default LabourCard;