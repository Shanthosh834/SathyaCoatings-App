import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import { useRoute } from '@react-navigation/native';
import { useSelection } from '../../SelectionContext';
import DateTimePicker from '@react-native-community/datetimepicker';
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

// PDF Generation Function
const generatePDFHTML = (title, data, type) => {
  let tableContent = '';
  
  switch (type) {
    case 'materialUsage':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Material</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Overall Qty</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Created At</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.item_name || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.overall_qty || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${formatDateTime(item.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'materialAcknowledgement':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Material</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Overall Quantity</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Created At</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.item_name || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.overall_quantity || 'N/A'}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${formatDateTime(item.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
  }
  
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

// Material Usage History Modal Component
const MaterialUsageHistoryModal = ({ visible, onClose, selection }) => {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (visible && selection) {
      fetchUsageHistory();
    } else {
      setUsageData([]);
    }
  }, [visible, selection]);

  const fetchUsageHistory = async () => {
    try {
      setLoading(true);
      
      // Get userId from SecureStore
      const userId = await SecureStore.getItemAsync("userId");
      
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        onClose();
        return;
      }

      console.log("Fetching usage history for userId:", userId);

      // Fetch usage history using the same endpoint as website
      const usageUrl = `http://103.118.158.127/api/site-incharge/material-usage-by-incharge/${userId}`;
      const response = await axios.get(usageUrl);

      console.log("Usage history response:", response.data);

      if (response.data.data && response.data.data.length > 0) {
        // Transform the data to match our display format
        const transformedData = [];
        
        response.data.data.forEach(item => {
          // Add main usage entry
          if (item.usage) {
            transformedData.push({
              id: `usage-${item.usage.id}`,
              item_name: item.usage.item_name,
              overall_qty: item.usage.overall_qty,
              remarks: item.usage.remarks,
              created_at: item.usage.created_at,
              updated_by: item.usage.updated_by_user_name,
              type: 'main'
            });
          }

          // Add daily history entries
          if (item.daily_history && item.daily_history.length > 0) {
            item.daily_history.forEach((daily,index) => {
              transformedData.push({
                id: `daily-${index}`,
                item_name: item.usage.item_name,
                overall_qty: daily.overall_qty,
                remarks: daily.remarks,
                created_at: daily.created_at,
                updated_by: daily.updated_by_user_name,
                entry_date: daily.entry_date,
                type: 'daily'
              });
            });
          }
        });

        setUsageData(transformedData);
      } else {
        setUsageData([]);
      }
    } catch (err) {
      console.error("Error fetching usage history:", err);
      Alert.alert("Error", "Failed to fetch usage history. Please try again.");
      setUsageData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      if (usageData.length === 0) {
        Alert.alert('No Data', 'No usage history to download');
        return;
      }

      const html = generatePDFHTML('Material Usage History', usageData, 'materialUsage');
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Material Usage History',
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">Material Usage History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading usage history...</Text>
              </View>
            ) : usageData.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="document-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No usage history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No material usage records found.
                </Text>
              </View>
            ) : (
              <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                {usageData.map((item) => (
                  <View key={item.id} className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
                    <Text className="mb-2 text-base font-semibold text-gray-800">
                      {item.item_name}
                    </Text>
                    <View className="gap-1">
                      <Text className="text-sm text-gray-600">
                        <Text className="font-semibold">Overall Qty:</Text> {item.overall_qty || 'N/A'}
                      </Text>
                      {item.entry_date && (
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Entry Date:</Text> {formatDateOnly(item.entry_date)}
                        </Text>
                      )}
                      <Text className="text-sm text-gray-600">
                        <Text className="font-semibold">Created:</Text> {formatDateTime(item.created_at)}
                      </Text>
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
                ))}
              </ScrollView>
            )}
          </View>

          {/* Buttons */}
          {!loading && (
            <View className="px-5 py-4 border-t border-gray-200 rounded-b-xl">
              {usageData.length > 0 ? (
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

// Acknowledgement Summary Modal Component
const AcknowledgementSummaryModal = ({ visible, onClose, selection }) => {
  const [ackData, setAckData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (visible && selection) {
      fetchAcknowledgementHistory();
    } else {
      setAckData([]);
    }
  }, [visible, selection]);

  const fetchAcknowledgementHistory = async () => {
    try {
      setLoading(true);
      
      // Get userId from SecureStore
      const userId = await SecureStore.getItemAsync("userId");
      
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        onClose();
        return;
      }

      console.log("Fetching acknowledgement history for userId:", userId);

      // Fetch acknowledgement history using the same endpoint as website
      const ackUrl = `http://103.118.158.127/api/site-incharge/acknowledgements-by-incharge/${userId}`;
      const response = await axios.get(ackUrl);

      console.log("Acknowledgement history response:", response.data);

      if (response.data.data && response.data.data.length > 0) {
        // Transform the data to match our display format
        const transformedData = [];
        
        response.data.data.forEach(item => {
          // Add main acknowledgement entry
          if (item.acknowledgement) {
            transformedData.push({
              id: `ack-${item.acknowledgement.id}`,
              item_name: item.acknowledgement.item_name,
              overall_quantity: item.acknowledgement.overall_quantity,
              remarks: item.acknowledgement.remarks,
              created_at: item.acknowledgement.created_at,
              updated_by: item.acknowledgement.updated_by_user_name,
              type: 'main'
            });
          }

          // Add history entries
          if (item.history && item.history.length > 0) {
            item.history.forEach(hist => {
              transformedData.push({
                id: `hist-${hist.id}`,
                item_name: hist.item_name,
                overall_quantity: hist.overall_quantity,
                remarks: hist.remarks,
                created_at: hist.created_at,
                updated_by: hist.updated_by_user_name,
                type: 'history'
              });
            });
          }
        });

        setAckData(transformedData);
      } else {
        setAckData([]);
      }
    } catch (err) {
      console.error("Error fetching acknowledgement history:", err);
      Alert.alert("Error", "Failed to fetch acknowledgement history. Please try again.");
      setAckData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      if (ackData.length === 0) {
        Alert.alert('No Data', 'No acknowledgement history to download');
        return;
      }

      const html = generatePDFHTML('Material Acknowledgement History', ackData, 'materialAcknowledgement');
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Material Acknowledgement History',
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">Acknowledgement History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading acknowledgements...</Text>
              </View>
            ) : ackData.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="document-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No acknowledgement history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No acknowledgement records found.
                </Text>
              </View>
            ) : (
              <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                {ackData.map((item) => (
                  <View key={item.id} className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
                    <Text className="mb-2 text-base font-semibold text-gray-800">
                      {item.item_name}
                    </Text>
                    <View className="gap-1">
                      <Text className="text-sm text-gray-600">
                        <Text className="font-semibold">Quantity:</Text> {item.overall_quantity || 'N/A'}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        <Text className="font-semibold">Created:</Text> {formatDateTime(item.created_at)}
                      </Text>
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
                ))}
              </ScrollView>
            )}
          </View>

          {/* Buttons */}
          {!loading && (
            <View className="px-5 py-4 border-t border-gray-200 rounded-b-xl">
              {ackData.length > 0 ? (
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

// Sub-options Modal (for Material module)
const SubOptionsModal = ({ visible, onClose, onSelectUsage, onSelectAcknowledgement }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity 
        className="items-center justify-center flex-1 bg-black/50" 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View className="w-11/12 overflow-hidden bg-white rounded-xl">
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500">
            <Text className="text-lg font-bold text-white">Material History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="p-5">
            <TouchableOpacity 
              className="items-center p-5 mb-4 border border-gray-200 rounded-lg bg-gray-50"
              onPress={onSelectUsage}
              activeOpacity={0.7}
            >
              <Ionicons name="trending-down-outline" size={28} color="#0f766e" />
              <Text className="mt-2 text-base font-semibold text-gray-800">Usage History</Text>
              <Text className="mt-1 text-xs text-center text-gray-500">View material consumption records</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="items-center p-5 border border-gray-200 rounded-lg bg-gray-50"
              onPress={onSelectAcknowledgement}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle-outline" size={28} color="#0f766e" />
              <Text className="mt-2 text-base font-semibold text-gray-800">Acknowledgement History</Text>
              <Text className="mt-1 text-xs text-center text-gray-500">View material receipt records</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Selection Info Header Component
const SelectionInfoHeader = ({ selection }) => (
  <View className="px-4 py-2 mx-4 mb-4 bg-white border border-gray-400 rounded-lg">
    <View className="flex-row flex-wrap">
      <View className="w-1/2 pr-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">COMPANY</Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.company?.company_name || "—"}
        </Text>
      </View>
      <View className="w-1/2 pl-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">PROJECT</Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.project?.project_name || "—"}
        </Text>
      </View>
      <View className="w-1/2 pr-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">SITE</Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.site?.site_name || "—"}
        </Text>
      </View>
      <View className="w-1/2 pl-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">WORK</Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.workDesc?.desc_name || "—"}
        </Text>
      </View>
    </View>
  </View>
);

// Reusable Card Component
const ViewCard = ({ title, iconName, onPress, description }) => (
  <TouchableOpacity
    onPress={onPress}
    className="w-[48%] mb-5 rounded-xl bg-white shadow-md border border-gray-200 overflow-hidden"
    activeOpacity={0.7}
  >
    <View className="justify-center border-b border-gray-200 h-11 bg-gray-50">
      <Text className="text-lg font-semibold text-center text-gray-700">{title}</Text>
    </View>
    <View className="items-center justify-center py-6 bg-white">
      <Ionicons name={iconName} size={36} color="#6b7280" />
      {description && (
        <Text className="px-2 mt-2 text-xs font-normal text-center text-gray-500">{description}</Text>
      )}
    </View>
  </TouchableOpacity>
);

// Main Views Screen Component
function ViewsMainScreen() {
  const { selection } = useSelection();
  const [subOptionsVisible, setSubOptionsVisible] = useState(false);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [acknowledgementModalVisible, setAcknowledgementModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleMaterialCardPress = useCallback(() => {
    setSubOptionsVisible(true);
  }, []);

  const handleUsageHistory = useCallback(() => {
    setSubOptionsVisible(false);
    setUsageModalVisible(true);
  }, []);

  const handleAcknowledgementHistory = useCallback(() => {
    setSubOptionsVisible(false);
    setAcknowledgementModalVisible(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  return (
    <View className="flex-1 bg-gray-100">
      <ScrollView
        contentContainerStyle={{ paddingVertical: 12, paddingHorizontal: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Selection Info Header */}
        {selection && <SelectionInfoHeader selection={selection} />}

        <View className="px-5 mb-5">
          <Text className="mb-1 text-2xl font-bold text-center text-slate-800">Overall Summary</Text>
        </View>

        <View className="flex-row flex-wrap justify-between px-1">
          <ViewCard
            title="Material"
            iconName="cube-outline"
            description="View material records"
            onPress={handleMaterialCardPress}
          />
          <ViewCard
            title="Expense"
            iconName="cash-outline"
            description="View expense records"
            onPress={() => Alert.alert('Coming Soon', 'Expense history will be available soon')}
          />
          <ViewCard
            title="Work"
            iconName="clipboard-outline"
            description="View work completion history"
            onPress={() => Alert.alert('Coming Soon', 'Work history will be available soon')}
          />
          <ViewCard
            title="Labour"
            iconName="people-outline"
            description="View labour assignment records"
            onPress={() => Alert.alert('Coming Soon', 'Labour history will be available soon')}
          />
        </View>
      </ScrollView>

      <SubOptionsModal
        visible={subOptionsVisible}
        onClose={() => setSubOptionsVisible(false)}
        onSelectUsage={handleUsageHistory}
        onSelectAcknowledgement={handleAcknowledgementHistory}
      />

      <MaterialUsageHistoryModal
        visible={usageModalVisible}
        onClose={() => setUsageModalVisible(false)}
        selection={selection}
      />

      <AcknowledgementSummaryModal
        visible={acknowledgementModalVisible}
        onClose={() => setAcknowledgementModalVisible(false)}
        selection={selection}
      />
    </View>
  );
}

export default function Views() {
  return <ViewsMainScreen />;
}