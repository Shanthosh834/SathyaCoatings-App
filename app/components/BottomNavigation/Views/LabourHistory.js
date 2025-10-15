import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  ActivityIndicator,
  Alert
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import * as SecureStore from "expo-secure-store";

// Helper function to format dates
const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" }).toLowerCase();
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day}-${month}-${year} [${time}]`;
};

const formatDateOnly = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" }).toLowerCase();
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

// PDF Generation Function for Labour Assignment
const generateAssignmentPDFHTML = (title, data) => {
  const tableContent = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #14b8a6; color: white;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Labour Name</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Mobile</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">From Date</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">To Date</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Salary</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Created By</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
            <td style="border: 1px solid #ddd; padding: 10px;">${item.full_name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.mobile || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.desc_name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${formatDateOnly(item.from_date)}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${formatDateOnly(item.to_date)}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">₹${item.salary || '0'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.created_by_user_name || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            padding: 40px;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #14b8a6;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #14b8a6;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #6b7280;
            margin: 10px 0 0 0;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${tableContent}
        <div class="footer">
          <p>This is a computer-generated document. No signature is required.</p>
        </div>
      </body>
    </html>
  `;
};

// PDF Generation Function for Labour Attendance
const generateAttendancePDFHTML = (title, data) => {
  const tableContent = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #14b8a6; color: white;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Labour Name</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Mobile</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Entry Date</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Shift</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Created By</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
            <td style="border: 1px solid #ddd; padding: 10px;">${item.full_name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.mobile || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${formatDateOnly(item.entry_date)}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.shift || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.created_by_user_name || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            padding: 40px;
            color: #1f2937;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #14b8a6;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #14b8a6;
            margin: 0;
            font-size: 28px;
          }
          .header p {
            color: #6b7280;
            margin: 10px 0 0 0;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        ${tableContent}
        <div class="footer">
          <p>This is a computer-generated document. No signature is required.</p>
        </div>
      </body>
    </html>
  `;
};

// Labour Assignment History Modal Component
export const LabourAssignmentHistoryModal = ({ visible, onClose, selection }) => {
  const [assignmentData, setAssignmentData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (visible && selection) {
      fetchAssignmentHistory();
    } else {
      setAssignmentData([]);
    }
  }, [visible, selection]);

  const fetchAssignmentHistory = async () => {
    try {
      setLoading(true);
      
      const userId = await SecureStore.getItemAsync("userId");
      
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        onClose();
        return;
      }

      console.log("Fetching labour assignment history for userId:", userId);

      const assignmentUrl = `http://10.252.71.28:5000/site-incharge/labour-assignment-by-incharge/${userId}`;
      
      console.log("Making request to:", assignmentUrl);
      
      const response = await axios.get(assignmentUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Assignment history response:", response.data);
      console.log("Response status:", response.status);

      if (response.data.data && response.data.data.length > 0) {
        const transformedData = [];
        let entryCounter = 0;
        
        response.data.data.forEach((item, itemIndex) => {
          // Add main assignment entry
          if (item.assignment) {
            transformedData.push({
              id: `assignment-${item.assignment.id || itemIndex}`,
              full_name: item.assignment.full_name || 'N/A',
              mobile: item.assignment.mobile || 'N/A',
              project_name: item.assignment.project_name || 'N/A',
              site_name: item.assignment.site_name || 'N/A',
              po_number: item.assignment.po_number || 'N/A',
              desc_name: item.assignment.desc_name || 'N/A',
              from_date: item.assignment.from_date,
              to_date: item.assignment.to_date,
              salary: item.assignment.salary || '0',
              created_at: item.assignment.created_at,
              updated_at: item.assignment.updated_at,
              created_by_user_name: item.assignment.created_by_user_name || 'N/A',
              updated_by_user_name: item.assignment.updated_by_user_name || 'N/A',
              type: 'main'
            });
          }

          // Add edit history
          if (item.edit_history && Array.isArray(item.edit_history) && item.edit_history.length > 0) {
            item.edit_history.forEach((edit, editIndex) => {
              transformedData.push({
                id: `edit-${edit.id || `${itemIndex}-${editIndex}-${entryCounter++}`}`,
                full_name: edit.full_name || item.assignment?.full_name || 'N/A',
                mobile: edit.mobile || item.assignment?.mobile || 'N/A',
                project_name: edit.project_name || item.assignment?.project_name || 'N/A',
                site_name: edit.site_name || item.assignment?.site_name || 'N/A',
                po_number: edit.po_number || item.assignment?.po_number || 'N/A',
                desc_name: edit.desc_name || item.assignment?.desc_name || 'N/A',
                from_date: edit.from_date,
                to_date: edit.to_date,
                salary: edit.salary || '0',
                created_at: edit.created_at,
                updated_at: edit.updated_at,
                created_by_user_name: edit.created_by_user_name || 'N/A',
                updated_by_user_name: edit.updated_by_user_name || 'N/A',
                type: 'edit'
              });
            });
          }
        });

        console.log("Transformed assignment data:", transformedData);
        console.log("Total records:", transformedData.length);
        setAssignmentData(transformedData);
      } else {
        console.log("No assignment data found in response");
        setAssignmentData([]);
      }
    } catch (err) {
      console.error("Error fetching assignment history:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = "Failed to fetch assignment history. Please try again.";
      
      if (err.response) {
        errorMessage = `Server Error: ${err.response.status}. ${err.response.data?.message || 'Please try again.'}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
      setAssignmentData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      if (assignmentData.length === 0) {
        Alert.alert('No Data', 'No assignment history to download');
        return;
      }

      const html = generateAssignmentPDFHTML('Labour Assignment History', assignmentData);
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Labour Assignment History',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error('PDF error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'main':
        return { label: 'Main', color: 'bg-blue-100', textColor: 'text-blue-700' };
      case 'edit':
        return { label: 'Edit', color: 'bg-purple-100', textColor: 'text-purple-700' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100', textColor: 'text-gray-700' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">Labour Assignment History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading assignment history...</Text>
              </View>
            ) : assignmentData.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No assignment history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No labour assignment records found.
                </Text>
              </View>
            ) : (
              <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                {assignmentData.map((item) => {
                  const badge = getTypeBadge(item.type);
                  return (
                    <View key={item.id} className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
                      {/* Labour Name and Type Badge */}
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="flex-1 text-base font-semibold text-gray-800">
                          {item.full_name}
                        </Text>
                        <View className={`px-2 py-1 ml-2 rounded ${badge.color}`}>
                          <Text className={`text-xs font-medium ${badge.textColor}`}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View className="gap-1">
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Mobile:</Text> {item.mobile}
                        </Text>
                        
                        {item.project_name && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Project:</Text> {item.project_name}
                          </Text>
                        )}
                        
                        {item.site_name && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Site:</Text> {item.site_name}
                          </Text>
                        )}
                        
                        {item.po_number && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">PO Number:</Text> {item.po_number}
                          </Text>
                        )}
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Description:</Text> {item.desc_name}
                        </Text>
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">From Date:</Text> {formatDateOnly(item.from_date)}
                        </Text>
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">To Date:</Text> {formatDateOnly(item.to_date)}
                        </Text>
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Salary:</Text> ₹{item.salary}
                        </Text>
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Created:</Text> {formatDateTime(item.created_at)}
                        </Text>
                        
                        {item.updated_at && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Updated:</Text> {formatDateTime(item.updated_at)}
                          </Text>
                        )}
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Created By:</Text> {item.created_by_user_name}
                        </Text>
                        
                        {item.updated_by_user_name && item.updated_by_user_name !== item.created_by_user_name && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Updated By:</Text> {item.updated_by_user_name}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Buttons */}
          {!loading && (
            <View className="px-5 py-4 border-t border-gray-200 rounded-b-xl">
              {assignmentData.length > 0 ? (
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={handleDownloadPDF} 
                    disabled={downloadingPDF}
                    className={`flex-1 flex-row justify-center items-center py-3 rounded-lg ${
                      downloadingPDF ? 'bg-gray-300' : 'bg-teal-500'
                    }`}
                  >
                    {downloadingPDF ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={20} color="white" />
                        <Text className="ml-2 text-base font-semibold text-white">Download PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={onClose} 
                    className="items-center justify-center flex-1 py-3 bg-gray-500 rounded-lg"
                  >
                    <Text className="text-base font-semibold text-white">Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={onClose} 
                  className="items-center justify-center py-3 bg-gray-500 rounded-lg"
                >
                  <Text className="text-base font-semibold text-white">Close</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Labour Attendance History Modal Component
export const LabourAttendanceHistoryModal = ({ visible, onClose, selection }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (visible && selection) {
      fetchAttendanceHistory();
    } else {
      setAttendanceData([]);
    }
  }, [visible, selection]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      
      const userId = await SecureStore.getItemAsync("userId");
      
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        onClose();
        return;
      }

      console.log("Fetching labour attendance history for userId:", userId);

      const attendanceUrl = `http://10.252.71.28:5000/site-incharge/labour-attendance-by-incharge/${userId}`;
      
      console.log("Making request to:", attendanceUrl);
      
      const response = await axios.get(attendanceUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Attendance history response:", response.data);
      console.log("Response status:", response.status);

      if (response.data.data && response.data.data.length > 0) {
        const transformedData = [];
        let entryCounter = 0;
        
        response.data.data.forEach((item, itemIndex) => {
          // Add main attendance entry
          if (item.attendance) {
            transformedData.push({
              id: `attendance-${item.attendance.id || itemIndex}`,
              full_name: item.attendance.full_name || 'N/A',
              mobile: item.attendance.mobile || 'N/A',
              entry_date: item.attendance.entry_date,
              shift: item.attendance.shift || 'N/A',
              remarks: item.attendance.remarks || '-',
              created_at: item.attendance.created_at,
              updated_at: item.attendance.updated_at,
              created_by_user_name: item.attendance.created_by_user_name || 'N/A',
              updated_by_user_name: item.attendance.updated_by_user_name || 'N/A',
              type: 'main'
            });
          }

          // Add edit history
          if (item.edit_history && Array.isArray(item.edit_history) && item.edit_history.length > 0) {
            item.edit_history.forEach((edit, editIndex) => {
              transformedData.push({
                id: `edit-${edit.id || `${itemIndex}-${editIndex}-${entryCounter++}`}`,
                full_name: edit.full_name || item.attendance?.full_name || 'N/A',
                mobile: edit.mobile || item.attendance?.mobile || 'N/A',
                entry_date: edit.entry_date,
                shift: edit.shift || 'N/A',
                remarks: edit.remarks || '-',
                created_at: edit.created_at,
                updated_at: edit.updated_at,
                created_by_user_name: edit.created_by_user_name || 'N/A',
                updated_by_user_name: edit.updated_by_user_name || 'N/A',
                type: 'edit'
              });
            });
          }
        });

        console.log("Transformed attendance data:", transformedData);
        console.log("Total records:", transformedData.length);
        setAttendanceData(transformedData);
      } else {
        console.log("No attendance data found in response");
        setAttendanceData([]);
      }
    } catch (err) {
      console.error("Error fetching attendance history:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = "Failed to fetch attendance history. Please try again.";
      
      if (err.response) {
        errorMessage = `Server Error: ${err.response.status}. ${err.response.data?.message || 'Please try again.'}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      if (attendanceData.length === 0) {
        Alert.alert('No Data', 'No attendance history to download');
        return;
      }

      const html = generateAttendancePDFHTML('Labour Attendance History', attendanceData);
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Labour Attendance History',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully');
      }
    } catch (error) {
      console.error('PDF error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'main':
        return { label: 'Main', color: 'bg-blue-100', textColor: 'text-blue-700' };
      case 'edit':
        return { label: 'Edit', color: 'bg-purple-100', textColor: 'text-purple-700' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100', textColor: 'text-gray-700' };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">Labour Attendance History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading attendance history...</Text>
              </View>
            ) : attendanceData.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No attendance history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No labour attendance records found.
                </Text>
              </View>
            ) : (
              <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                {attendanceData.map((item) => {
                  const badge = getTypeBadge(item.type);
                  return (
                    <View key={item.id} className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
                      {/* Labour Name and Type Badge */}
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="flex-1 text-base font-semibold text-gray-800">
                          {item.full_name}
                        </Text>
                        <View className={`px-2 py-1 ml-2 rounded ${badge.color}`}>
                          <Text className={`text-xs font-medium ${badge.textColor}`}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View className="gap-1">
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Mobile:</Text> {item.mobile}
                        </Text>
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Entry Date:</Text> {formatDateOnly(item.entry_date)}
                        </Text>
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Shift:</Text> {item.shift}
                        </Text>
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Created:</Text> {formatDateTime(item.created_at)}
                        </Text>
                        
                        {item.updated_at && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Updated:</Text> {formatDateTime(item.updated_at)}
                          </Text>
                        )}
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Created By:</Text> {item.created_by_user_name}
                        </Text>
                        
                        {item.updated_by_user_name && item.updated_by_user_name !== item.created_by_user_name && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Updated By:</Text> {item.updated_by_user_name}
                          </Text>
                        )}
                        
                        {item.remarks && item.remarks !== '-' && (
                          <Text className="mt-1 text-xs italic text-gray-500">
                            <Text className="not-italic font-semibold">Remarks:</Text> {item.remarks}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Buttons */}
          {!loading && (
            <View className="px-5 py-4 border-t border-gray-200 rounded-b-xl">
              {attendanceData.length > 0 ? (
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={handleDownloadPDF} 
                    disabled={downloadingPDF}
                    className={`flex-1 flex-row justify-center items-center py-3 rounded-lg ${
                      downloadingPDF ? 'bg-gray-300' : 'bg-teal-500'
                    }`}
                  >
                    {downloadingPDF ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons name="download-outline" size={20} color="white" />
                        <Text className="ml-2 text-base font-semibold text-white">Download PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={onClose} 
                    className="items-center justify-center flex-1 py-3 bg-gray-500 rounded-lg"
                  >
                    <Text className="text-base font-semibold text-white">Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={onClose} 
                  className="items-center justify-center py-3 bg-gray-500 rounded-lg"
                >
                  <Text className="text-base font-semibold text-white">Close</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Sub-options Modal (for Labour module)
export const LabourSubOptionsModal = ({ visible, onClose, onSelectAssignment, onSelectAttendance }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        className="items-center justify-center flex-1 bg-black/50" 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View className="w-11/12 overflow-hidden bg-white rounded-xl">
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500">
            <Text className="text-lg font-bold text-white">Labour History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="p-5">
            <TouchableOpacity 
              className="items-center p-5 mb-4 border border-gray-200 rounded-lg bg-gray-50"
              onPress={onSelectAssignment}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={28} color="#0f766e" />
              <Text className="mt-2 text-base font-semibold text-gray-800">Assignment History</Text>
              <Text className="mt-1 text-xs text-center text-gray-500">View labour assignment records</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center p-5 border border-gray-200 rounded-lg bg-gray-50"
              onPress={onSelectAttendance}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={28} color="#0f766e" />
              <Text className="mt-2 text-base font-semibold text-gray-800">Attendance History</Text>
              <Text className="mt-1 text-xs text-center text-gray-500">View labour attendance records</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Function to handle Labour card press
export const handleLabourPress = () => {
  console.log('Labour history accessed');
};

export default LabourAttendanceHistoryModal;