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
// Sample history data
const sampleHistoryData = {
  materialUsage: [
    { id: 1, date: '2024-01-15', item: 'Cement', usedQty: '25', totalQty: '50', site: 'Site A', remarks: 'Foundation work' },
    { id: 2, date: '2024-01-14', item: 'Steel Bars', usedQty: '100kg', totalQty: '200kg', site: 'Site B', remarks: 'Column work' },
    { id: 3, date: '2024-01-13', item: 'Bricks', usedQty: '500', totalQty: '1000', site: 'Site A', remarks: 'Wall construction' },
  ],
  expense: [
    { id: 1, date: '2024-01-15', category: 'Transportation', amount: '₹5,000', site: 'Site A', approvedBy: 'Manager A' },
    { id: 2, date: '2024-01-14', category: 'Equipment Rent', amount: '₹12,000', site: 'Site B', approvedBy: 'Manager B' },
    { id: 3, date: '2024-01-13', category: 'Fuel', amount: '₹3,500', site: 'Site A', approvedBy: 'Manager A' },
  ],
  work: [
    { id: 1, date: '2024-01-15', task: 'Foundation Work', progress: '75%', site: 'Site A', assignedTo: 'Team A' },
    { id: 2, date: '2024-01-14', task: 'Brick Laying', progress: '60%', site: 'Site B', assignedTo: 'Team B' },
    { id: 3, date: '2024-01-13', task: 'Plastering', progress: '90%', site: 'Site A', assignedTo: 'Team C' },
  ],
  labour: [
    { id: 1, date: '2024-01-15', worker: 'John Doe', hours: '8', site: 'Site A', task: 'Foundation' },
    { id: 2, date: '2024-01-14', worker: 'Jane Smith', hours: '6', site: 'Site B', task: 'Masonry' },
    { id: 3, date: '2024-01-13', worker: 'Mike Johnson', hours: '8', site: 'Site A', task: 'Plastering' },
  ],
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
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Item</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Used/Total</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Comp A</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Comp B</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Comp C</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Site</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
            <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.item}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.usedQty} / ${item.totalQty}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.comp_a_qty || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.comp_b_qty || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.comp_c_qty || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.site}</td>
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
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Category</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Amount</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Site</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Approved By</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.category}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">${item.amount}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.site}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.approvedBy}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'work':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Task</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Progress</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Site</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.task}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">${item.progress}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.site}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.assignedTo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;
      
    case 'labour':
      tableContent = `
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #14b8a6; color: white;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Worker</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Hours</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Site</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Task</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => `
              <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
                <td style="border: 1px solid #ddd; padding: 10px;">${item.date}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.worker}</td>
                <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">${item.hours}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.site}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.task}</td>
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
      const dispatchUrl = `http://10.140.205.28:5000/material/dispatch-details/?pd_id=${projectId}&site_id=${siteId}${descId ? `&desc_id=${descId}` : ''}`;
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
        const ackUrl = `http://10.140.205.28:5000/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`;
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
    <Modal visible={visible} transparent animationType="">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">Acknowledgement Summary</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area - MUST BE VISIBLE */}
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

          {/* Buttons - Show AFTER content */}
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

  // Add useEffect to detect when data is being fetched
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
                <Text className="font-semibold">Used:</Text> {item.usedQty} / {item.totalQty}
              </Text>
              <Text className="text-sm text-gray-600">
                <Text className="font-semibold">Site:</Text> {item.site}
              </Text>
              
              {/* Component Details */}
              {(item.comp_a_qty || item.comp_b_qty || item.comp_c_qty) && (
                <View className="pt-1 mt-1 border-t border-gray-300">
                  <Text className="text-xs font-semibold text-gray-700">Components:</Text>
                  {item.comp_a_qty && (
                    <Text className="text-xs text-gray-600">• Component A: {item.comp_a_qty}</Text>
                  )}
                  {item.comp_b_qty && (
                    <Text className="text-xs text-gray-600">• Component B: {item.comp_b_qty}</Text>
                  )}
                  {item.comp_c_qty && (
                    <Text className="text-xs text-gray-600">• Component C: {item.comp_c_qty}</Text>
                  )}
                </View>
              )}
              
              {item.remarks && item.remarks !== '-' && (
                <Text className="mt-1 text-xs italic text-gray-500">
                  <Text className="not-italic font-semibold">Remarks:</Text> {item.remarks}
                </Text>
              )}
              
              {item.created_at && (
                <Text className="mt-1 text-xs text-gray-400">
                  Created: {item.created_at}
                </Text>
              )}
            </View>
          </View>
        );

      case 'expense':
        return (
          <View className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.category}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.date}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">Amount: {item.amount}</Text>
              <Text className="text-sm text-gray-600">Site: {item.site}</Text>
              <Text className="text-sm text-gray-600">Approved by: {item.approvedBy}</Text>
            </View>
          </View>
        );

      case 'work':
        return (
          <View className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.task}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.date}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">Progress: {item.progress}</Text>
              <Text className="text-sm text-gray-600">Site: {item.site}</Text>
              <Text className="text-sm text-gray-600">Team: {item.assignedTo}</Text>
            </View>
          </View>
        );

      case 'labour':
        return (
          <View className="p-4 mb-3 border-l-4 border-teal-500 rounded-lg bg-gray-50">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="flex-1 text-base font-semibold text-gray-800">{item.worker}</Text>
              <Text className="text-xs font-medium text-gray-500">{item.date}</Text>
            </View>
            <View className="gap-1">
              <Text className="text-sm text-gray-600">Hours: {item.hours}</Text>
              <Text className="text-sm text-gray-600">Site: {item.site}</Text>
              <Text className="text-sm text-gray-600">Task: {item.task}</Text>
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
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-teal-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area - MUST BE VISIBLE */}
          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {fetchingData ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#14b8a6" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading usage history...</Text>
              </View>
            ) : data.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="document-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No usage history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No material usage records found for the selected criteria.
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

          {/* Buttons - Show AFTER content */}
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

// Selection Info Header Component
const SelectionInfoHeader = ({ selection }) => (
  <View className="px-4 py-2 mx-4 mb-4 bg-white border border-gray-400 rounded-lg">
    <View className="flex-row flex-wrap">
      {/* Company */}
      <View className="w-1/2 pr-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          COMPANY
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.company?.company_name || "—"}
        </Text>
      </View>

      {/* Project */}
      <View className="w-1/2 pl-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          PROJECT
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.project?.project_name || "—"}
        </Text>
      </View>

      {/* Site */}
      <View className="w-1/2 pr-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">
          SITE
        </Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.site?.site_name || "—"}
        </Text>
      </View>

      {/* Work */}
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
                  const lastWeek = new Date(today.setDate(today.getDate() - 7));
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
                  const lastMonth = new Date(today.setDate(today.getDate() - 30));
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

// Main Views Screen Component
function ViewsMainScreen() {
  const route = useRoute();
  const {selection} = useSelection();
  
  // Debug log
  React.useEffect(() => {
    console.log("ViewsMainScreen - Current selection:", JSON.stringify(selection, null, 2));
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
  
   // ADD THESE NEW STATES
  const [dateFilterVisible, setDateFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30))); // Last 30 days
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState(null); // 'usage' or 'acknowledgement'

  const openHistoryModal = useCallback((type, title) => {
    setModalState({
      visible: true,
      title,
      data: sampleHistoryData[type] || [],
      type,
    });
  }, []);

  const closeHistoryModal = useCallback(() => {
    setModalState({
      visible: false,
      title: '',
      data: [],
      type: '',
    });
  }, []);

  const handleMaterialCardPress = useCallback(() => {
    setSubOptionsVisible(true);
  }, []);
  

//   const handleUsageHistory = useCallback(async () => {
//   setSubOptionsVisible(false);
  
//   const projectId = selection?.project?.pd_id || selection?.project?.project_id || selection?.project?.id;
//   const siteId = selection?.site?.site_id || selection?.site?.id;
//   const descId = selection?.workDesc?.work_desc_id || selection?.workDesc?.desc_id || selection?.workDesc?.id || '';
  
//   console.log("Project ID:", projectId, "Site ID:", siteId, "Desc ID:", descId);
  
//   if (!projectId || !siteId) {
//     Alert.alert(
//       "Selection Required", 
//       "Please select Company, Project, and Site before viewing usage history."
//     );
//     return;
//   }

//   // Show modal immediately with loading state
//   setModalState({
//     visible: true,
//     title: 'Material Usage History',
//     data: [],
//     type: 'materialUsage',
//   });
  
//   try {
//     // First get dispatch details
//     const dispatchUrl = `http://10.140.205.28:5000/material/dispatch-details/?pd_id=${projectId}&site_id=${siteId}${descId ? `&desc_id=${descId}` : ''}`;
//     console.log("Fetching dispatches from:", dispatchUrl);
    
//     const dispatchResponse = await axios.get(dispatchUrl);
//     console.log("Dispatch response:", JSON.stringify(dispatchResponse.data, null, 2));

//     if (!dispatchResponse.data.data || dispatchResponse.data.data.length === 0) {
//       console.log("No dispatch data found");
//       return;
//     }

//     // Get unique dispatches
//     const dispatchMap = new Map();
//     dispatchResponse.data.data.forEach(dispatch => {
//       if (!dispatchMap.has(dispatch.id)) {
//         dispatchMap.set(dispatch.id, dispatch);
//       }
//     });
//     const uniqueDispatches = Array.from(dispatchMap.values());
//     console.log("Unique dispatches:", uniqueDispatches.length);

//     // Get acknowledgements for each dispatch
//     const ackPromises = uniqueDispatches.map(dispatch => {
//       const ackUrl = `http://10.140.205.28:5000/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`;
//       console.log("Fetching ack from:", ackUrl);
//       return axios.get(ackUrl).catch(() => ({ data: { data: [] } }));
//     });
//     const ackResponses = await Promise.all(ackPromises);
//     console.log("Acknowledgement responses count:", ackResponses.length);

//     // Get usage details for each acknowledgement
//     const usagePromises = [];
//     const today = new Date().toISOString().split('T')[0];

//     ackResponses.forEach((ackResponse, index) => {
//       const dispatch = uniqueDispatches[index];
//       const ackData = ackResponse.data.data && ackResponse.data.data.length > 0 ? ackResponse.data.data[0] : null;
      
//       console.log(`Dispatch ${dispatch.id} - Full Ack data:`, JSON.stringify(ackData, null, 2));
      
//       if (ackData) {
//         // Try different possible field names for material_ack_id
//         const materialAckId = ackData.id || ackData.material_ack_id || ackData.ack_id;
        
//         console.log(`Found ack ID: ${materialAckId} for dispatch ${dispatch.id}`);
        
//         if (materialAckId) {
//           const usageUrl = `http://10.140.205.28:5000/site-incharge/material-usage-details?material_ack_id=${materialAckId}&date=${today}`;
          
//           console.log("Fetching usage from:", usageUrl);
          
//           usagePromises.push(
//             axios.get(usageUrl)
//               .then(res => {
//                 console.log(`Usage data for ack ${materialAckId}:`, JSON.stringify(res.data, null, 2));
//                 return {
//                   dispatch,
//                   ackData,
//                   usageData: res.data.data
//                 };
//               })
//               .catch(err => {
//                 console.log(`Error fetching usage for ack ${materialAckId}:`, err.message);
//                 return null;
//               })
//           );
//         } else {
//           console.log("No material_ack_id found in ack data:", Object.keys(ackData));
//         }
//       }
//     });

//     const usageResults = await Promise.all(usagePromises);
//     console.log("Usage results:", usageResults.length);
    
//     // Transform data for display
//     const usageHistory = [];
//     usageResults.forEach(result => {
//       if (result && result.usageData && result.usageData.entries) {
//         console.log("Processing entries:", result.usageData.entries.length);
//         result.usageData.entries.forEach(entry => {
//           usageHistory.push({
//             id: entry.entry_id,
//             date: new Date(entry.entry_date).toLocaleDateString('en-IN'),
//             item: result.dispatch.item_name,
//             usedQty: entry.overall_qty || '0',
//             totalQty: result.usageData.cumulative?.overall_qty || '0',
//             site: selection?.site?.site_name || 'N/A',
//             remarks: entry.remarks || '-',
//             comp_a_qty: entry.comp_a_qty,
//             comp_b_qty: entry.comp_b_qty,
//             comp_c_qty: entry.comp_c_qty,
//             created_at: new Date(entry.created_at).toLocaleString('en-IN')
//           });
//         });
//       }
//     });

//     console.log("Final usage history count:", usageHistory.length);
//     console.log("Usage history data:", JSON.stringify(usageHistory, null, 2));

//     setModalState({
//       visible: true,
//       title: 'Material Usage History',
//       data: usageHistory,
//       type: 'materialUsage',
//     });

//   } catch (error) {
//     console.error("Error fetching usage history:", error);
//     Alert.alert("Error", "Failed to fetch usage history. Please try again.");
//     setModalState({
//       visible: false,
//       title: '',
//       data: [],
//       type: '',
//     });
//   }
// }, [selection]);


const handleUsageHistory = useCallback(async () => {
  setSubOptionsVisible(false);
  setSelectedFilterType('usage');
  setDateFilterVisible(true);
}, []);

const applyDateFilter = useCallback(async () => {
  setDateFilterVisible(false);
  
  const projectId = selection?.project?.pd_id || selection?.project?.project_id || selection?.project?.id;
  const siteId = selection?.site?.site_id || selection?.site?.id;
  const descId = selection?.workDesc?.work_desc_id || selection?.workDesc?.desc_id || selection?.workDesc?.id || '';
  
  if (!projectId || !siteId) {
    Alert.alert(
      "Selection Required", 
      "Please select Company, Project, and Site before viewing usage history."
    );
    return;
  }

  // Show modal immediately with loading state
  setModalState({
    visible: true,
    title: `Material Usage History (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`,
    data: [],
    type: 'materialUsage',
  });
  
  try {
    const dispatchUrl = `http://10.140.205.28:5000/material/dispatch-details/?pd_id=${projectId}&site_id=${siteId}${descId ? `&desc_id=${descId}` : ''}`;
    const dispatchResponse = await axios.get(dispatchUrl);

    if (!dispatchResponse.data.data || dispatchResponse.data.data.length === 0) {
      return;
    }

    const dispatchMap = new Map();
    dispatchResponse.data.data.forEach(dispatch => {
      if (!dispatchMap.has(dispatch.id)) {
        dispatchMap.set(dispatch.id, dispatch);
      }
    });
    const uniqueDispatches = Array.from(dispatchMap.values());

    // Get acknowledgements
    const ackPromises = uniqueDispatches.map(dispatch => {
      const ackUrl = `http://10.140.205.28:5000/site-incharge/acknowledgement-details?material_dispatch_id=${dispatch.id}`;
      return axios.get(ackUrl).catch(() => ({ data: { data: [] } }));
    });
    const ackResponses = await Promise.all(ackPromises);

    // Get usage details for date range
    const usagePromises = [];
    const dateRange = getDatesInRange(startDate, endDate);

    ackResponses.forEach((ackResponse, index) => {
      const dispatch = uniqueDispatches[index];
      const ackData = ackResponse.data.data && ackResponse.data.data.length > 0 ? ackResponse.data.data[0] : null;
      
      if (ackData) {
        const materialAckId = ackData.id || ackData.material_ack_id || ackData.ack_id;
        
        if (materialAckId) {
          // Fetch usage for each date in range
          dateRange.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const usageUrl = `http://10.140.205.28:5000/site-incharge/material-usage-details?material_ack_id=${materialAckId}&date=${dateStr}`;
            
            usagePromises.push(
              axios.get(usageUrl)
                .then(res => ({
                  dispatch,
                  ackData,
                  usageData: res.data.data,
                  date: dateStr
                }))
                .catch(() => null)
            );
          });
        }
      }
    });

    const usageResults = await Promise.all(usagePromises);
    
    // Transform data for display
    const usageHistory = [];
    usageResults.forEach(result => {
      if (result && result.usageData && result.usageData.entries) {
        result.usageData.entries.forEach(entry => {
          usageHistory.push({
            id: `${entry.entry_id}-${result.date}`,
            date: new Date(entry.entry_date).toLocaleDateString('en-IN'),
            item: result.dispatch.item_name,
            usedQty: entry.overall_qty || '0',
            totalQty: result.usageData.cumulative?.overall_qty || '0',
            site: selection?.site?.site_name || 'N/A',
            remarks: entry.remarks || '-',
            comp_a_qty: entry.comp_a_qty,
            comp_b_qty: entry.comp_b_qty,
            comp_c_qty: entry.comp_c_qty,
            created_at: new Date(entry.created_at).toLocaleString('en-IN')
          });
        });
      }
    });

    setModalState({
      visible: true,
      title: `Material Usage History (${startDate.toLocaleDateString('en-IN')} - ${endDate.toLocaleDateString('en-IN')})`,
      data: usageHistory,
      type: 'materialUsage',
    });

  } catch (error) {
    console.error("Error fetching usage history:", error);
    Alert.alert("Error", "Failed to fetch usage history. Please try again.");
    setModalState({
      visible: false,
      title: '',
      data: [],
      type: '',
    });
  }
}, [selection, startDate, endDate]);

// Helper function to get all dates in range
const getDatesInRange = (start, end) => {
  const dates = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};
  const handleAcknowledgementHistory = useCallback(() => {
    setSubOptionsVisible(false);
    
    // Just log the selection for debugging - let the modal handle validation
    console.log("Opening acknowledgement modal with selection:", selection);
    
    setAcknowledgementModalVisible(true);
  }, [selection]);

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
            onPress={() => openHistoryModal('expense', 'Expense History')}
          />
          <ViewCard
            title="Work"
            iconName="clipboard-outline"
            description="View work completion history"
            onPress={() => openHistoryModal('work', 'Work History')}
          />
          <ViewCard
            title="Labour"
            iconName="people-outline"
            description="View labour assignment records"
            onPress={() => openHistoryModal('labour', 'Labour History')}
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