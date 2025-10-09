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
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://192.168.137.1:5000';

// Helper function to format date
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
  return `${day} ${month} ${year} | ${time}`;
};

const formatDateOnly = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("default", { month: "short" }).toLowerCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// PDF Generation Function (Updated for all types)
const generatePDFHTML = (title, data, type) => {
  let tableContent = '';
  
  switch (type) {
    case 'materialUsage':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Overall Qty</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.item}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.overallQty}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
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
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Overall Quantity</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.item_name || item.item}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.overall_quantity || item.receivedQty}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'expense':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Expense Type</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Actual Value</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.expenseName}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">${item.actualValue}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'completion':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Subcategory</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Area Completed</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Value</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.category}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.subcategory}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">${item.areaCompleted}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'labourAssignment':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Labour Name</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Mobile</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">From Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">To Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Salary</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.labourName}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.mobile}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.fromDate}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.toDate}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">${item.salary}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;

    case 'labourAttendance':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Labour Name</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Mobile</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Shift</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.labourName}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.mobile}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">${item.shift}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
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

// Acknowledgement Summary Modal Component
const AcknowledgementSummaryModal = ({ visible, onClose, selection }) => {
  const [dispatchData, setDispatchData] = useState([]);
  const [ackDetails, setAckDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  React.useEffect(() => {
    if (visible && selection) {
      fetchAcknowledgementSummary();
    } else {
      setDispatchData([]);
      setAckDetails({});
    }
  }, [visible, selection]);

  const fetchAcknowledgementSummary = async () => {
    const projectId = selection?.project?.pd_id || selection?.project?.project_id || selection?.project?.id;
    const siteId = selection?.site?.site_id || selection?.site?.id;
    const descId = selection?.workDesc?.work_desc_id || selection?.workDesc?.desc_id || selection?.workDesc?.id || '';
    
    if (!projectId || !siteId) {
      Alert.alert(
        "Selection Required", 
        "Please select Company, Project, and Site before viewing acknowledgement history.",
        [{ text: "OK", onPress: onClose }]
      );
      return;
    }

    setLoading(true);
    try {
      const dispatchUrl = `${API_BASE_URL}/material/dispatch-details/?pd_id=${projectId}&site_id=${siteId}${descId ? `&desc_id=${descId}` : ''}`;
      const dispatchResponse = await axios.get(dispatchUrl);

      if (!dispatchResponse.data.data || dispatchResponse.data.data.length === 0) {
        setDispatchData([]);
        setAckDetails({});
        setLoading(false);
        return;
      }

      const dispatchMap = new Map();
      dispatchResponse.data.data.forEach(dispatch => {
        if (!dispatchMap.has(dispatch.id)) {
          dispatchMap.set(dispatch.id, dispatch);
        }
      });

      const uniqueDispatches = Array.from(dispatchMap.values());
      setDispatchData(uniqueDispatches);

      const ackPromises = uniqueDispatches.map(dispatch => {
        const ackUrl = `${API_BASE_URL}/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`;
        return axios.get(ackUrl).catch(() => ({ data: { data: [] } }));
      });

      const ackResponses = await Promise.all(ackPromises);
      const ackMap = {};
      
      ackResponses.forEach((ackResponse, index) => {
        const dispatchId = uniqueDispatches[index].id;
        const ackData = ackResponse.data.data && ackResponse.data.data.length > 0 ? ackResponse.data.data[0] : null;
        if (ackData) {
          ackMap[dispatchId] = ackData;
        }
      });
      
      setAckDetails(ackMap);
    } catch (err) {
      console.error("Error:", err);
      Alert.alert("Error", "Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      const acknowledgedItems = dispatchData
        .filter(item => {
          const ack = ackDetails[item.id];
          return ack && (ack.acknowledgement || ack.overall_quantity);
        })
        .map(item => {
          const ack = ackDetails[item.id]?.acknowledgement || ackDetails[item.id];
          return {
            item_name: item.item_name,
            overall_quantity: ack.overall_quantity || 'N/A',
            remarks: ack.remarks || '-'
          };
        });

      if (acknowledgedItems.length === 0) {
        Alert.alert('No Data', 'No acknowledged materials to download');
        return;
      }

      const html = generatePDFHTML('Material Acknowledgement Summary', acknowledgedItems, 'materialAcknowledgement');
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Material Acknowledgement Summary',
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

  const acknowledgedItems = dispatchData.filter(item => {
    const ack = ackDetails[item.id];
    return ack && (ack.acknowledgement || ack.overall_quantity);
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">Acknowledgement Summary</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading acknowledgements...</Text>
              </View>
            ) : acknowledgedItems.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="document-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No acknowledged materials found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  {dispatchData.length > 0 
                    ? `Found ${dispatchData.length} dispatch(es) but none are acknowledged yet.`
                    : "No dispatch records found."}
                </Text>
              </View>
            ) : (
              <ScrollView className="px-4 py-4" showsVerticalScrollIndicator={false}>
                {acknowledgedItems.map((item) => {
                  const ack = ackDetails[item.id]?.acknowledgement || ackDetails[item.id];
                  return (
                    <View key={item.id} className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
                      <Text className="mb-2 text-base font-semibold text-gray-800">
                        {item.item_name}
                      </Text>
                      <View className="gap-1">
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Dispatched:</Text> {item.quantity || 'N/A'}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Acknowledged:</Text> {ack?.overall_quantity || 'N/A'}
                        </Text>
                        <Text className="text-sm text-gray-600">
                          <Text className="font-semibold">Date:</Text> {item.dispatch_date || 'N/A'}
                        </Text>
                        {ack?.remarks && (
                          <Text className="mt-1 text-xs italic text-gray-500">
                            <Text className="not-italic font-semibold">Remarks:</Text> {ack.remarks}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {!loading && (
            <View className="px-5 py-4 border-t border-gray-200 rounded-b-xl">
              {acknowledgedItems.length > 0 ? (
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

// History Modal Component (for other history types)
const HistoryModal = ({ visible, onClose, title, data, type }) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (visible && data.length === 0) {
      setFetchingData(true);
    } else {
      setFetchingData(false);
    }
  }, [visible, data]);

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      const html = generatePDFHTML(title, data, type);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share ${title}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }) => {
    switch (type) {
      case 'materialUsage':
        return (
          <View className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.item}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.date}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Overall Qty:</Text> {item.overallQty}
              </Text>
              {item.remarks && item.remarks !== '-' && (
                <Text className="mt-1 text-xs italic text-gray-500">
                  <Text className="not-italic font-semibold">Remarks:</Text> {item.remarks}
                </Text>
              )}
              {item.createdAt && (
                <Text className="mt-1 text-xs text-gray-400">
                  Created: {item.createdAt}
                </Text>
              )}
            </View>
          </View>
        );

      case 'expense':
        return (
          <View className="p-4 mb-3 border-l-4 border-orange-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.expenseName}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.date}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Actual Value:</Text> {item.actualValue}
              </Text>
              {item.remarks && item.remarks !== '-' && (
                <Text className="mt-1 text-xs italic text-gray-500">
                  <Text className="not-italic font-semibold">Remarks:</Text> {item.remarks}
                </Text>
              )}
              {item.createdAt && (
                <Text className="mt-1 text-xs text-gray-400">
                  Created: {item.createdAt}
                </Text>
              )}
            </View>
          </View>
        );

      case 'completion':
        return (
          <View className="p-4 mb-3 border-l-4 border-purple-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.category}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.date}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Subcategory:</Text> {item.subcategory}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Area Completed:</Text> {item.areaCompleted}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Value:</Text> {item.value}
              </Text>
              {item.remarks && item.remarks !== '-' && (
                <Text className="mt-1 text-xs italic text-gray-500">
                  <Text className="not-italic font-semibold">Remarks:</Text> {item.remarks}
                </Text>
              )}
            </View>
          </View>
        );

      case 'labourAssignment':
        return (
          <View className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.labourName}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.mobile}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">From:</Text> {item.fromDate}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">To:</Text> {item.toDate}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Salary:</Text> {item.salary}
              </Text>
            </View>
          </View>
        );

      case 'labourAttendance':
        return (
          <View className="p-4 mb-3 border-l-4 border-pink-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.labourName}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.date}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Mobile:</Text> {item.mobile}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Shift:</Text> {item.shift}
              </Text>
              {item.remarks && item.remarks !== '-' && (
                <Text className="mt-1 text-xs italic text-gray-500">
                  <Text className="not-italic font-semibold">Remarks:</Text> {item.remarks}
                </Text>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {fetchingData ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading history...</Text>
              </View>
            ) : data.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="document-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No records found for the selected criteria.
                </Text>
              </View>
            ) : (
              <FlatList
                data={data}
                renderItem={renderHistoryItem}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16 }}
              />
            )}
          </View>

          {!fetchingData && (
            <View className="px-5 py-4 border-t border-gray-200 rounded-b-xl">
              {data.length > 0 ? (
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={handleDownloadPDF} 
                    disabled={loading}
                    className={`flex-1 flex-row justify-center items-center py-3 rounded-lg ${
                      loading ? 'bg-gray-300' : 'bg-teal-500'
                    }`}
                  >
                    {loading ? (
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

// Date Filter Modal Component
const DateFilterModal = ({ 
  visible, 
  onClose, 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onApply,
  showStartPicker,
  showEndPicker,
  setShowStartPicker,
  setShowEndPicker
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 p-5 bg-white rounded-2xl">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">Select Date Range</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Start Date */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Start Date</Text>
            <TouchableOpacity 
              onPress={() => setShowStartPicker(true)}
              className="flex-row items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50"
            >
              <Text className="text-base text-gray-800">
                {startDate.toLocaleDateString('en-IN')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* End Date */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">End Date</Text>
            <TouchableOpacity 
              onPress={() => setShowEndPicker(true)}
              className="flex-row items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50"
            >
              <Text className="text-base text-gray-800">
                {endDate.toLocaleDateString('en-IN')}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Quick Select Buttons */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Quick Select</Text>
            <View className="flex-row flex-wrap gap-2">
              <TouchableOpacity 
                onPress={() => {
                  const today = new Date();
                  onStartDateChange(today);
                  onEndDateChange(today);
                }}
                className="px-3 py-2 bg-blue-100 rounded-lg"
              >
                <Text className="text-xs font-medium text-blue-700">Today</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  const today = new Date();
                  const lastWeek = new Date(today.getTime());
                  lastWeek.setDate(today.getDate() - 7);
                  onStartDateChange(lastWeek);
                  onEndDateChange(new Date());
                }}
                className="px-3 py-2 bg-blue-100 rounded-lg"
              >
                <Text className="text-xs font-medium text-blue-700">Last 7 Days</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getTime());
                  lastMonth.setDate(today.getDate() - 30);
                  onStartDateChange(lastMonth);
                  onEndDateChange(new Date());
                }}
                className="px-3 py-2 bg-blue-100 rounded-lg"
              >
                <Text className="text-xs font-medium text-blue-700">Last 30 Days</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  onStartDateChange(firstDay);
                  onEndDateChange(new Date());
                }}
                className="px-3 py-2 bg-blue-100 rounded-lg"
              >
                <Text className="text-xs font-medium text-blue-700">This Month</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={onClose}
              className="items-center justify-center flex-1 py-3 bg-gray-300 rounded-lg"
            >
              <Text className="font-semibold text-gray-700">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onApply}
              className="items-center justify-center flex-1 py-3 bg-teal-500 rounded-lg"
            >
              <Text className="font-semibold text-white">Apply Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Date Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  onStartDateChange(selectedDate);
                }
              }}
              maximumDate={new Date()}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) {
                  onEndDateChange(selectedDate);
                }
              }}
              maximumDate={new Date()}
              minimumDate={startDate}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

// Selection Info Header Component
const SelectionInfoHeader = ({ selection }) => (
  <View className="px-4 py-2 mx-4 mb-4 bg-white border border-gray-400 rounded-lg">
    <View className="flex-row flex-wrap">
      <View className="w-1/2 pr-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          COMPANY
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.company?.company_name || "—"}
        </Text>
      </View>

      <View className="w-1/2 pl-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          PROJECT
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.project?.project_name || "—"}
        </Text>
      </View>

      <View className="w-1/2 pr-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          SITE
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.site?.site_name || "—"}
        </Text>
      </View>

      <View className="w-1/2 pl-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          WORK
        </Text>
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
  const route = useRoute();
  const {selection} = useSelection();
  const [encodedUserId, setEncodedUserId] = useState(null);

  // Get encodedUserId from SecureStore on component mount
  useEffect(() => {
    const getStoredUserId = async () => {
      try {
        const storedId = await SecureStore.getItemAsync("encodedUserId");
        console.log('Stored encodedUserId from SecureStore:', storedId);
        setEncodedUserId(storedId);
      } catch (error) {
        console.error('Error getting stored user ID:', error);
      }
    };
    
    getStoredUserId();
  }, []);

  // Updated getUserIdFromSelection function
  const getUserIdFromSelection = useCallback(() => {
    // Priority 1: Use encodedUserId from SecureStore
    if (encodedUserId) {
      try {
        const decodedId = atob(encodedUserId);
        console.log('Decoded User ID from SecureStore:', decodedId);
        return decodedId;
      } catch (err) {
        console.error("Error decoding userId:", err);
        return null;
      }
    }
    
    // Priority 2: Fallback to route params
    const { encodedUserId: routeEncodedUserId } = route.params || {};
    if (routeEncodedUserId) {
      try {
        const decodedId = atob(routeEncodedUserId);
        console.log('Decoded User ID from route:', decodedId);
        return decodedId;
      } catch (err) {
        console.error("Error decoding route userId:", err);
      }
    }
    
    // Priority 3: Fallback to selection context
    return selection?.user?.user_id || selection?.user?.id || selection?.userId || null;
  }, [encodedUserId, route.params, selection]);

  useEffect(() => {
    console.log("Full selection context:", JSON.stringify(selection, null, 2));
    
    // Check all possible user ID locations
    console.log("Possible user ID paths:");
    console.log("selection?.user?.user_id:", selection?.user?.user_id);
    console.log("selection?.user?.id:", selection?.user?.id);
    console.log("selection?.userId:", selection?.userId);
    console.log("selection?.id:", selection?.id);
    console.log("selection?.user_id:", selection?.user_id);
  }, [selection]);
  
  const [modalState, setModalState] = useState({
    visible: false,
    title: '',
    data: [],
    type: '',
  });
  const [subOptionsVisible, setSubOptionsVisible] = useState(false);
  const [acknowledgementModalVisible, setAcknowledgementModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState(null);

  useEffect(() => {
    console.log("ViewsMainScreen - Current selection:", JSON.stringify(selection, null, 2));
  }, [selection]);

  // Fetch Material Usage History
  const fetchMaterialUsageHistory = useCallback(async (fromDate, toDate) => {
    const userId = getUserIdFromSelection();
    
    if (!userId) {
      Alert.alert("Error", "User ID not found. Please login again.");
      return [];
    }

    try {
      const url = `${API_BASE_URL}/site-incharge/material-usage-by-incharge/${userId}`;
      const response = await axios.get(url);
      
      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }

      const usageHistory = [];
      response.data.data.forEach(item => {
        if (item.daily_history && item.daily_history.length > 0) {
          item.daily_history.forEach(daily => {
            const entryDate = new Date(daily.entry_date);
            if (entryDate >= fromDate && entryDate <= toDate) {
              usageHistory.push({
                id: daily.entry_id || `${item.usage.id}-${daily.entry_date}`,
                date: formatDateOnly(daily.entry_date),
                item: item.usage.item_name,
                overallQty: daily.overall_qty || '0',
                remarks: daily.remarks || '-',
                createdAt: formatDateTime(daily.created_at)
              });
            }
          });
        }
      });

      return usageHistory;
    } catch (error) {
      console.error("Error fetching usage history:", error);
      throw error;
    }
  }, [getUserIdFromSelection]);

  // Fetch Expense History
  const fetchExpenseHistory = useCallback(async (fromDate, toDate) => {
    const userId = getUserIdFromSelection();
    
    if (!userId) {
      Alert.alert("Error", "User ID not found. Please login again.");
      return [];
    }

    try {
      const url = `${API_BASE_URL}/site-incharge/expense-by-incharge/${userId}`;
      const response = await axios.get(url);
      
      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }

      const expenseHistory = [];
      response.data.data.forEach(item => {
        if (item.daily_history && item.daily_history.length > 0) {
          item.daily_history.forEach(daily => {
            const entryDate = new Date(daily.entry_date);
            if (entryDate >= fromDate && entryDate <= toDate) {
              expenseHistory.push({
                id: daily.entry_id || `${item.expense.id}-${daily.entry_date}`,
                date: formatDateOnly(daily.entry_date),
                expenseName: daily.expense_name || item.expense.expense_name,
                actualValue: daily.actual_value || '0',
                remarks: daily.remarks || '-',
                createdAt: formatDateTime(daily.created_at)
              });
            }
          });
        }
      });

      return expenseHistory;
    } catch (error) {
      console.error("Error fetching expense history:", error);
      throw error;
    }
  }, [getUserIdFromSelection]);

  // Fetch Completion History
  const fetchCompletionHistory = useCallback(async (fromDate, toDate) => {
    const userId = getUserIdFromSelection();
    
    if (!userId) {
      Alert.alert("Error", "User ID not found. Please login again.");
      return [];
    }

    try {
      const url = `${API_BASE_URL}/site-incharge/completion-by-incharge/${userId}`;
      const response = await axios.get(url);
      
      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }

      const completionHistory = [];
      response.data.data.forEach(item => {
        if (item.entries_history && item.entries_history.length > 0) {
          item.entries_history.forEach(entry => {
            const entryDate = new Date(entry.entry_date);
            if (entryDate >= fromDate && entryDate <= toDate) {
              completionHistory.push({
                id: entry.entry_id || `${item.completion.id}-${entry.entry_date}`,
                date: formatDateOnly(entry.entry_date),
                category: entry.category_name || item.completion.category_name,
                subcategory: entry.subcategory_name || item.completion.subcategory_name,
                areaCompleted: entry.area_added || '0',
                value: entry.value_added || '0',
                remarks: entry.remarks || '-'
              });
            }
          });
        }
      });

      return completionHistory;
    } catch (error) {
      console.error("Error fetching completion history:", error);
      throw error;
    }
  }, [getUserIdFromSelection]);

  // Fetch Labour Assignment History
  const fetchLabourAssignmentHistory = useCallback(async (fromDate, toDate) => {
    const userId = getUserIdFromSelection();
    
    if (!userId) {
      Alert.alert("Error", "User ID not found. Please login again.");
      return [];
    }

    try {
      const url = `${API_BASE_URL}/site-incharge/labour-assignment-by-incharge/${userId}`;
      const response = await axios.get(url);
      
      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }

      const assignmentHistory = [];
      response.data.data.forEach(item => {
        const fromDateItem = new Date(item.assignment.from_date);
        if (fromDateItem >= fromDate && fromDateItem <= toDate) {
          assignmentHistory.push({
            id: item.assignment.id,
            labourName: item.assignment.full_name,
            mobile: item.assignment.mobile || 'N/A',
            fromDate: formatDateOnly(item.assignment.from_date),
            toDate: formatDateOnly(item.assignment.to_date),
            salary: item.assignment.salary || '0'
          });
        }
      });

      return assignmentHistory;
    } catch (error) {
      console.error("Error fetching labour assignment history:", error);
      throw error;
    }
  }, [getUserIdFromSelection]);

  // Fetch Labour Attendance History
  const fetchLabourAttendanceHistory = useCallback(async (fromDate, toDate) => {
    const userId = getUserIdFromSelection();
    
    if (!userId) {
      Alert.alert("Error", "User ID not found. Please login again.");
      return [];
    }

    try {
      const url = `${API_BASE_URL}/site-incharge/labour-attendance-by-incharge/${userId}`;
      const response = await axios.get(url);
      
      if (!response.data.data || response.data.data.length === 0) {
        return [];
      }

      const attendanceHistory = [];
      response.data.data.forEach(item => {
        const entryDate = new Date(item.attendance.entry_date);
        if (entryDate >= fromDate && entryDate <= toDate) {
          attendanceHistory.push({
            id: item.attendance.id,
            date: formatDateOnly(item.attendance.entry_date),
            labourName: item.attendance.full_name,
            mobile: item.attendance.mobile || 'N/A',
            shift: item.attendance.shift || 'N/A',
            remarks: item.attendance.remarks || '-'
          });
        }
      });

      return attendanceHistory;
    } catch (error) {
      console.error("Error fetching labour attendance history:", error);
      throw error;
    }
  }, [getUserIdFromSelection]);

  const handleMaterialCardPress = useCallback(() => {
    setSubOptionsVisible(true);
  }, []);

  const handleUsageHistory = useCallback(() => {
    setSubOptionsVisible(false);
    setSelectedFilterType('usage');
    setDateFilterVisible(true);
  }, []);

  const handleAcknowledgementHistory = useCallback(() => {
    setSubOptionsVisible(false);
    setAcknowledgementModalVisible(true);
  }, []);

  const handleExpenseHistory = useCallback(() => {
    setSelectedFilterType('expense');
    setDateFilterVisible(true);
  }, []);

  const handleCompletionHistory = useCallback(() => {
    setSelectedFilterType('completion');
    setDateFilterVisible(true);
  }, []);

  const handleLabourAssignmentHistory = useCallback(() => {
    setSelectedFilterType('labourAssignment');
    setDateFilterVisible(true);
  }, []);

  const handleLabourAttendanceHistory = useCallback(() => {
    setSelectedFilterType('labourAttendance');
    setDateFilterVisible(true);
  }, []);

  const applyDateFilter = useCallback(async () => {
    setDateFilterVisible(false);
    // In applyDateFilter, add this check:
console.log('Selected date range:', startDate, 'to', endDate);
console.log('Selected filter type:', selectedFilterType);
    
    const userId = getUserIdFromSelection();
    if (!userId) {
      Alert.alert("Error", "User ID not found. Please login again.");
      return;
    }

    // Show modal immediately with loading state
    let title = '';
    let type = '';
    
    switch (selectedFilterType) {
      case 'usage':
        title = 'Material Usage History';
        type = 'materialUsage';
        break;
      case 'expense':
        title = 'Expense History';
        type = 'expense';
        break;
      case 'completion':
        title = 'Work Completion History';
        type = 'completion';
        break;
      case 'labourAssignment':
        title = 'Labour Assignment History';
        type = 'labourAssignment';
        break;
      case 'labourAttendance':
        title = 'Labour Attendance History';
        type = 'labourAttendance';
        break;
    }

    setModalState({
      visible: true,
      title: `${title} (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`,
      data: [],
      type: type,
    });
    
    try {
      let historyData = [];
      
      switch (selectedFilterType) {
        case 'usage':
          historyData = await fetchMaterialUsageHistory(startDate, endDate);
          break;
        case 'expense':
          historyData = await fetchExpenseHistory(startDate, endDate);
          break;
        case 'completion':
          historyData = await fetchCompletionHistory(startDate, endDate);
          break;
        case 'labourAssignment':
          historyData = await fetchLabourAssignmentHistory(startDate, endDate);
          break;
        case 'labourAttendance':
          historyData = await fetchLabourAttendanceHistory(startDate, endDate);
          break;
      }

      setModalState({
        visible: true,
        title: `${title} (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`,
        data: historyData,
        type: type,
      });

    } catch (error) {
      console.error("Error fetching history:", error);
      Alert.alert("Error", "Failed to fetch history. Please try again.");
      setModalState({
        visible: false,
        title: '',
        data: [],
        type: '',
      });
    }
  }, [getUserIdFromSelection, startDate, endDate, selectedFilterType, fetchMaterialUsageHistory, fetchExpenseHistory, fetchCompletionHistory, fetchLabourAssignmentHistory, fetchLabourAttendanceHistory]);

  const closeHistoryModal = useCallback(() => {
    setModalState({
      visible: false,
      title: '',
      data: [],
      type: '',
    });
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
            onPress={handleExpenseHistory}
          />
          <ViewCard
            title="Work"
            iconName="clipboard-outline"
            description="View work completion history"
            onPress={handleCompletionHistory}
          />
          <ViewCard
            title="Labour"
            iconName="people-outline"
            description="View labour records"
            onPress={handleLabourAssignmentHistory}
          />
        </View>
      </ScrollView>

      <SubOptionsModal
        visible={subOptionsVisible}
        onClose={() => setSubOptionsVisible(false)}
        onSelectUsage={handleUsageHistory}
        onSelectAcknowledgement={handleAcknowledgementHistory}
      />

      <AcknowledgementSummaryModal
        visible={acknowledgementModalVisible}
        onClose={() => setAcknowledgementModalVisible(false)}
        selection={selection}
      />

      <HistoryModal
        visible={modalState.visible}
        onClose={closeHistoryModal}
        title={modalState.title}
        data={modalState.data}
        type={modalState.type}
      />

      <DateFilterModal
        visible={dateFilterVisible}
        onClose={() => setDateFilterVisible(false)}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApply={applyDateFilter}
        showStartPicker={showStartDatePicker}
        showEndPicker={showEndDatePicker}
        setShowStartPicker={setShowStartDatePicker}
 	setShowEndPicker={setShowEndDatePicker}
/>
    </View>
  );
}

export default function Views() {
  return <ViewsMainScreen />;
}