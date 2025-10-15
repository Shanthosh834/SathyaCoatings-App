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

// PDF Generation Function for Expense History
const generateExpensePDFHTML = (title, data) => {
  const tableContent = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f59e0b; color: white;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Expense Name</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Type</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Amount</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Date</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Remarks</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Created By</th>
        </tr>
      </thead>
      <tbody>
        ${data.map((item, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : 'white'};">
            <td style="border: 1px solid #ddd; padding: 10px;">${item.expense_name || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.type || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">₹${item.actual_value || '0'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${formatDateOnly(item.entry_date || item.created_at)}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.remarks || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px;">${item.created_by_user_name || 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
      <p style="margin: 0; font-weight: bold; color: #92400e;">Total Expenses: ₹${data.reduce((sum, item) => sum + (parseFloat(item.actual_value) || 0), 0).toFixed(2)}</p>
    </div>
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
            border-bottom: 3px solid #f59e0b;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #f59e0b;
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

// Get unique dates from expense data
const getUniqueDates = (data) => {
  const dates = new Set();
  data.forEach(item => {
    const dateStr = formatDateOnly(item.entry_date || item.created_at);
    if (dateStr !== "N/A") {
      dates.add(dateStr);
    }
  });
  return Array.from(dates).sort((a, b) => {
    // Sort dates in descending order (newest first)
    const dateA = new Date(a.split('-').reverse().join('-'));
    const dateB = new Date(b.split('-').reverse().join('-'));
    return dateB - dateA;
  });
};

// Expense History Modal Component
export const ExpenseHistory = ({ visible, onClose, selection }) => {
  const [expenseData, setExpenseData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('all');
  const [availableDates, setAvailableDates] = useState([]);

  useEffect(() => {
    if (visible && selection) {
      fetchExpenseHistory();
    } else {
      setExpenseData([]);
      setFilteredData([]);
      setSelectedDate('all');
      setAvailableDates([]);
    }
  }, [visible, selection]);

  useEffect(() => {
    if (expenseData.length > 0) {
      const dates = getUniqueDates(expenseData);
      setAvailableDates(dates);
      filterExpensesByDate();
    }
  }, [expenseData, selectedDate]);

  const filterExpensesByDate = () => {
    if (selectedDate === 'all') {
      setFilteredData(expenseData);
      return;
    }

    const filtered = expenseData.filter(item => {
      const itemDate = formatDateOnly(item.entry_date || item.created_at);
      return itemDate === selectedDate;
    });

    setFilteredData(filtered);
  };

  const fetchExpenseHistory = async () => {
    try {
      setLoading(true);
      
      // Get userId from SecureStore
      const userId = await SecureStore.getItemAsync("userId");
      
      if (!userId) {
        Alert.alert("Error", "User ID not found. Please login again.");
        onClose();
        return;
      }

      console.log("Fetching expense history for userId:", userId);

      // Fetch expense history using the expenses endpoint
      const expenseUrl = `http://10.252.71.28:5000/site-incharge/expense-by-incharge/${userId}`;
      
      console.log("Making request to:", expenseUrl);
      
      const response = await axios.get(expenseUrl, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Expense history response:", response.data);
      console.log("Response status:", response.status);

      if (response.data.data && response.data.data.length > 0) {
        // Transform the nested data structure to flat array
        const transformedData = [];
        let entryCounter = 0;
        
        response.data.data.forEach((item, itemIndex) => {
          // Add main expense entry
          if (item.expense) {
            transformedData.push({
              id: `expense-${item.expense.id || itemIndex}`,
              expense_name: item.expense.expense_name || 'N/A',
              actual_value: item.expense.actual_value || '0',
              difference_value: item.expense.difference_value || '0',
              splitted_budget: item.expense.splitted_budget || '0',
              remarks: item.expense.remarks || '-',
              created_at: item.expense.created_at,
              updated_at: item.expense.updated_at,
              created_by_user_name: item.expense.updated_by_user_name || 'N/A',
              updated_by_user_name: item.expense.updated_by_user_name || 'N/A',
              type: 'Main Budget'
            });
          }

          // Add daily history entries
          if (item.daily_history && Array.isArray(item.daily_history) && item.daily_history.length > 0) {
            item.daily_history.forEach((daily, dailyIndex) => {
              // Add the daily entry itself
              transformedData.push({
                id: `daily-${daily.id || `${itemIndex}-${dailyIndex}-${entryCounter++}`}`,
                expense_name: daily.expense_name || item.expense?.expense_name || 'N/A',
                actual_value: daily.actual_value || '0',
                remarks: daily.remarks || '-',
                entry_date: daily.entry_date,
                created_at: daily.created_at,
                updated_at: daily.updated_at,
                created_by_user_name: daily.created_by_user_name || 'N/A',
                updated_by_user_name: daily.updated_by_user_name || 'N/A',
                type: 'Daily Entry'
              });

              // Add edit history for this daily entry
              if (daily.edit_history && Array.isArray(daily.edit_history) && daily.edit_history.length > 0) {
                daily.edit_history.forEach((edit, editIndex) => {
                  transformedData.push({
                    id: `edit-${edit.id || `${itemIndex}-${dailyIndex}-${editIndex}-${entryCounter++}`}`,
                    expense_name: edit.expense_name || daily.expense_name || item.expense?.expense_name || 'N/A',
                    actual_value: edit.actual_value || '0',
                    remarks: edit.remarks || '-',
                    created_at: edit.created_at,
                    updated_at: edit.updated_at,
                    created_by_user_name: edit.created_by_user_name || 'N/A',
                    updated_by_user_name: edit.updated_by_user_name || 'N/A',
                    type: 'Edit History'
                  });
                });
              }
            });
          }
        });

        console.log("Transformed expense data:", transformedData);
        console.log("Total records:", transformedData.length);
        setExpenseData(transformedData);
        setFilteredData(transformedData);
      } else {
        console.log("No expense data found in response");
        setExpenseData([]);
        setFilteredData([]);
      }
    } catch (err) {
      console.error("Error fetching expense history:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMessage = "Failed to fetch expense history. Please try again.";
      
      if (err.response) {
        errorMessage = `Server Error: ${err.response.status}. ${err.response.data?.message || 'Please try again.'}`;
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      Alert.alert("Error", errorMessage);
      setExpenseData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      
      if (filteredData.length === 0) {
        Alert.alert('No Data', 'No expense history to download');
        return;
      }

      const html = generateExpensePDFHTML('Expense History', filteredData);
      const { uri } = await Print.printToFileAsync({ html });
      
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Expense History',
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
      case 'Main Budget':
        return { label: 'Main', color: 'bg-blue-100', textColor: 'text-blue-700' };
      case 'Daily Entry':
        return { label: 'Daily', color: 'bg-green-100', textColor: 'text-green-700' };
      case 'Edit History':
        return { label: 'Edit', color: 'bg-purple-100', textColor: 'text-purple-700' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100', textColor: 'text-gray-700' };
    }
  };

  const totalAmount = filteredData.reduce((sum, item) => sum + (parseFloat(item.actual_value) || 0), 0);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="items-center justify-center flex-1 bg-black/50">
        <View className="w-11/12 bg-white rounded-xl" style={{ maxHeight: '80%' }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-amber-500 rounded-t-xl">
            <Text className="text-lg font-bold text-white">Expense History</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <View style={{ minHeight: 300, maxHeight: 500 }}>
            {loading ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <ActivityIndicator size="large" color="#f59e0b" />
                <Text className="mt-3 text-sm font-medium text-slate-600">Loading expense history...</Text>
              </View>
            ) : expenseData.length === 0 ? (
              <View className="items-center justify-center" style={{ height: 300 }}>
                <Ionicons name="cash-outline" size={48} color="#9ca3af" />
                <Text className="mt-3 text-base font-medium text-gray-400">No expense history found</Text>
                <Text className="px-8 mt-2 text-xs text-center text-gray-500">
                  No expense records found.
                </Text>
              </View>
            ) : (
              <>
                {/* Simple Date Filter */}
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(!showDatePicker)}
                  className="flex-row items-center justify-between px-4 py-3 mx-4 mt-3 mb-2 border border-l-4 rounded-lg border-amber-500 bg-amber-50"
                >
                  <View>
                    <Text className="text-xs font-medium text-amber-700">Date</Text>
                    <Text className="mt-1 text-lg font-bold text-amber-900">
                      {selectedDate === 'all' ? 'All Dates' : selectedDate}
                    </Text>
                  </View>

                  <Ionicons 
                    name={showDatePicker ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color="#f59e0b" 
                  />
                </TouchableOpacity>

                {/* Date List Dropdown */}
                {showDatePicker && (
                  <View className="mx-4 mb-3 overflow-hidden bg-white border border-gray-300 rounded-lg" style={{ maxHeight: 200 }}>
                    <ScrollView showsVerticalScrollIndicator={true}>
                      {/* All Dates Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedDate('all');
                          setShowDatePicker(false);
                        }}
                        className={`py-4 px-4 border-b border-gray-200 ${
                          selectedDate === 'all' ? 'bg-amber-100' : 'bg-white'
                        }`}
                      >
                        <Text className={`text-base ${
                          selectedDate === 'all' 
                            ? 'font-bold text-amber-900' 
                            : 'font-medium text-gray-700'
                        }`}>
                          All Dates
                        </Text>
                      </TouchableOpacity>

                      {/* Individual Date Options */}
                      {availableDates.map((date) => (
                        <TouchableOpacity
                          key={date}
                          onPress={() => {
                            setSelectedDate(date);
                            setShowDatePicker(false);
                          }}
                          className={`py-4 px-4 border-b border-gray-200 ${
                            selectedDate === date ? 'bg-amber-100' : 'bg-white'
                          }`}
                        >
                          <Text className={`text-base ${
                            selectedDate === date 
                              ? 'font-bold text-amber-900' 
                              : 'font-medium text-gray-700'
                          }`}>
                            {date}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Total Amount Display */}
                <View className="py-3 mx-4 mb-2 border-t border-amber-200">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-medium text-gray-700">Total:</Text>
                    <Text className="text-2xl font-bold text-amber-900">₹{totalAmount.toFixed(2)}</Text>
                  </View>
                </View>

                {filteredData.length === 0 ? (
                  <View className="items-center justify-center py-10">
                    <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
                    <Text className="mt-3 text-base font-medium text-gray-400">No records for this date</Text>
                  </View>
                ) : (
                  <ScrollView className="px-4 pb-4" showsVerticalScrollIndicator={false}>
                    {filteredData.map((item) => {
                      const badge = getTypeBadge(item.type);
                      return (
                        <View key={item.id} className="p-4 mb-3 border-l-4 rounded-lg border-amber-500 bg-gray-50">
                          {/* Type Badge and Expense Name */}
                          <View className="flex-row items-center justify-between mb-2">
                            <Text className="flex-1 text-base font-semibold text-gray-800">
                              {item.expense_name}
                            </Text>
                            <View className={`px-2 py-1 ml-2 rounded ${badge.color}`}>
                              <Text className={`text-xs font-medium ${badge.textColor}`}>
                                {badge.label}
                              </Text>
                            </View>
                          </View>

                          {/* Amount Badge */}
                          <View className="self-start px-3 py-1 mb-2 rounded-full bg-amber-100">
                            <Text className="text-sm font-bold text-amber-800">
                              ₹{item.actual_value}
                            </Text>
                          </View>

                          <View className="gap-1">
                            {/* Show budget info for Main Budget type */}
                            {item.type === 'Main Budget' && (
                              <>
                                {item.splitted_budget && (
                                  <Text className="text-sm text-gray-600">
                                    <Text className="font-semibold">Budget:</Text> ₹{item.splitted_budget}
                                  </Text>
                                )}
                                {item.difference_value && (
                                  <Text className="text-sm text-gray-600">
                                    <Text className="font-semibold">Difference:</Text> ₹{item.difference_value}
                                  </Text>
                                )}
                              </>
                            )}
                            
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
                            
                            {item.created_by_user_name && (
                              <Text className="text-sm text-gray-600">
                                <Text className="font-semibold">Created By:</Text> {item.created_by_user_name}
                              </Text>
                            )}
                            
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
              </>
            )}
          </View>

          {/* Buttons */}
          {!loading && (
            <View className="px-5 py-4 border-t border-gray-200 rounded-b-xl">
              {filteredData.length > 0 ? (
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={handleDownloadPDF} 
                    disabled={downloadingPDF}
                    className={`flex-1 flex-row justify-center items-center py-3 rounded-lg ${
                      downloadingPDF ? 'bg-gray-300' : 'bg-amber-500'
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

export default ExpenseHistory;