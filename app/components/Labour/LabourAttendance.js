import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import LabourCard from './LabourCard';

// API Configuration
const API_CONFIG = {
  BASE_URL: "http://103.118.158.127/api",
  TIMEOUT: 15000,
};

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// Labour Attendance Page Component
const LabourAttendance = () => {
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);

  
  // Fetch labours from API
  useEffect(() => {
    const fetchLabours = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/site-incharge/labours');
        const laboursData = response.data?.data || response.data || [];
        setLabours(laboursData);
      } catch (error) {
        console.error('Error fetching labours:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to fetch labour data',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLabours();
  }, []);

  const handleLabourUsage = (labourId) => {
    console.log('Mark attendance clicked for labour ID:', labourId);
    // Add your attendance marking logic here
  };

  const handleLabourView = (labourId) => {
    console.log('Labour view clicked for ID:', labourId);
    // Add your view logic here
  };

  const renderLabourCard = ({ item }) => (
    <LabourCard
      itemId={item.id}
      itemName={item.full_name}
      phone={item.phone || item.mobile}
      status={item.status || 'unknown'}
      onView={() => handleLabourView(item.id)}
      onUsage={handleLabourUsage}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Loading labours...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {labours.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9ca3af" />
          <Text style={styles.emptyText}>No labours found</Text>
          <Text style={styles.emptySubtext}>Please check your connection and try again</Text>
        </View>
      ) : (
        <FlatList
          data={labours}
          renderItem={renderLabourCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.laboursList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Toast />
    </View>
  );
};

export default LabourAttendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  laboursList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});