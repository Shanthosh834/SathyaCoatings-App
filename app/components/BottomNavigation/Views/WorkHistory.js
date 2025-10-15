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

// PDF Generation Function for Work History
const generateWorkPDFHTML = (title, data) => {
  const tableContent = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #14b8a6; color: white;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Subcategory</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Description</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Area Completed</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Rate</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Value</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Created At</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
            <td style="border: 1px solid #ddd; padding: 10px;">${item.category_name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.subcategory_name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.desc_name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.area_completed || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.rate || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.value || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${formatDateTime(item.created_at)}</td>
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

// Work History Modal Component
export const WorkHistory = ({ visible, onClose, selection }) => {
  const [workData, setWorkData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (visible && selection) {
      fetchWorkHistory();
    } else {
      setWorkData([]);
    }
  }, [visible, selection]);

  const fetchWorkHistory = async () => {
    try {
      setLoading(true);
      
      // Get userId from SecureStore
      const userId = await SecureStore.getItemAsync("userId");
      
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        onClose();
        return;
      }

      console.log("Fetching work completion history for userId:", userId);

      // Fetch work completion history using the same endpoint as website
      const workUrl = `http://10.252.71.28:5000/site-incharge/completion-by-incharge/${userId}`;
      
      console.log("Making request to:", workUrl);
      
      const response = await axios.get(workUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Work history response:", response.data);
      console.log("Response status:", response.status);

      if (response.data.data && response.data.data.length > 0) {
        // Transform the data to match our display format
        const transformedData = [];
        let entryCounter = 0;
        
        response.data.data.forEach((item, itemIndex) => {
          // Add main completion entry
          if (item.completion) {
            transformedData.push({
              id: `completion-${item.completion.id || itemIndex}`,
              category_name: item.completion.category_name || 'N/A',
              subcategory_name: item.completion.subcategory_name || 'N/A',
              desc_name: item.completion.desc_name || 'N/A',
              area_completed: item.completion.area_completed || '0',
              rate: item.completion.rate || '0',
              value: item.completion.value || '0',
              remarks: item.completion.remarks || '-',
              created_at: item.completion.created_at,
              updated_at: item.completion.updated_at,
              created_by: item.completion.created_by_user_name || 'N/A',
              updated_by: item.completion.updated_by_user_name || 'N/A',
              type: 'main'
            });
          }

          // Add entries history
          if (item.entries_history && Array.isArray(item.entries_history) && item.entries_history.length > 0) {
            item.entries_history.forEach((entry, entryIndex) => {
              transformedData.push({
                id: `entry-${entry.id || `${itemIndex}-${entryIndex}-${entryCounter++}`}`,
                category_name: entry.category_name || item.completion?.category_name || 'N/A',
                subcategory_name: entry.subcategory_name || item.completion?.subcategory_name || 'N/A',
                desc_name: entry.desc_name || item.completion?.desc_name || 'N/A',
                area_completed: entry.area_added || '0',
                rate: entry.rate || '0',
                value: entry.value_added || '0',
                remarks: entry.remarks || '-',
                created_at: entry.created_at,
                entry_date: entry.entry_date,
                created_by: entry.created_by_user_name || 'N/A',
                type: 'entry'
              });
            });
          }

          // Add status edit history
          if (item.status_edit_history && Array.isArray(item.status_edit_history) && item.status_edit_history.length > 0) {
            item.status_edit_history.forEach((edit, editIndex) => {
              transformedData.push({
                id: `edit-${edit.id || `${itemIndex}-${editIndex}-${entryCounter++}`}`,
                category_name: edit.category_name || item.completion?.category_name || 'N/A',
                subcategory_name: edit.subcategory_name || item.completion?.subcategory_name || 'N/A',
                desc_name: edit.desc_name || item.completion?.desc_name || 'N/A',
                area_completed: edit.area_completed || '0',
                rate: edit.rate || '0',
                value: edit.value || '0',
                remarks: edit.remarks || '-',
                created_at: edit.created_at,
                updated_at: edit.updated_at,
                created_by: edit.created_by_user_name || 'N/A',
                updated_by: edit.updated_by_user_name || 'N/A',
                type: 'edit'
              });
            });
          }
        });

        console.log("Transformed work data:", transformedData);
        console.log("Total records:", transformedData.length);
        setWorkData(transformedData);
      } else {
        console.log("No work data found in response");
        setWorkData([]);
      }
    } catch (err) {
      console.error("Error fetching work history:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = "Failed to fetch work history. Please try again.";
      
      if (err.response) {
        errorMessage = `Server Error: ${err.response.status}. ${err.response.data?.message || 'Please try again.'}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
      setWorkData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      if (workData.length === 0) {
        Alert.alert('No Data', 'No work history to download');
        return;
      }

      const html = generateWorkPDFHTML('Work Completion History', workData);
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Work Completion History',
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
      case 'entry':
        return { label: 'Entry', color: 'bg-green-100', textColor: 'text-green-700' };
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
            <Text className="text-lg font-bold text-white">Work Completion History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading work history...</Text>
              </View>
            ) : workData.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="document-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No work history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No work completion records found.
                </Text>
              </View>
            ) : (
              <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                {workData.map((item) => {
                  const badge = getTypeBadge(item.type);
                  return (
                    <View key={item.id} className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
                      {/* Type Badge */}
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs font-semibold text-gray-800">
                          {item.desc_name}
                        </Text>
                        <View className={`px-2 py-1 rounded ${badge.color}`}>
                          <Text className={`text-xs font-medium ${badge.textColor}`}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>

                      <View className="gap-1">
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold text">Category:</Text> {item.category_name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Subcategory:</Text> {item.subcategory_name}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Area Completed:</Text> {item.area_completed}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Rate:</Text> {item.rate}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Value:</Text> {item.value}
                        </Text>
                        
                        {item.entry_date && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Entry Date:</Text> {formatDateOnly(item.entry_date)}
                          </Text>
                        )}
                        
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Created:</Text> {formatDateTime(item.created_at)}
                        </Text>
                        
                        {item.updated_at && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Updated:</Text> {formatDateTime(item.updated_at)}
                          </Text>
                        )}
                        
                        {item.created_by && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Created By:</Text> {item.created_by}
                          </Text>
                        )}
                        
                        {item.updated_by && (
                          <Text className="text-sm text-gray-600">
                            <Text className="font-semibold">Updated By:</Text> {item.updated_by}
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
              {workData.length > 0 ? (
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

export const handleWorkPress = () => {
  console.log("🚀 handleWorkPress called"); // This will always log
  Alert.alert("Coming Soon", "Work history will be available soon");
  <WorkHistory />
};

// Export default
export default WorkHistory;