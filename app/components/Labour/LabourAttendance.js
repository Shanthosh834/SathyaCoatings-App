import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import LabourCard from './LabourCard';

const API_CONFIG = {
  BASE_URL: "http://ip",
  TIMEOUT: 15000,
};

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

const LabourAttendance = ({ route }) => {
  const { selection } = route?.params || {};
  const navigation = useNavigation();
  const [labours, setLabours] = useState([]);
  const [loading, setLoading] = useState(true);

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
  };

  const handleLabourView = (labourId) => {
    console.log('Labour view clicked for ID:', labourId);
  };

  const handleNavigateToAssignment = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'LabourAssignmentModule',
        params: { selection }
      })
    );
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
      {selection && (
        <View style={styles.selectionSummary}>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>COMPANY</Text>
              <Text style={styles.summaryValue}>
                {selection.company?.company_name || "—"}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>PROJECT</Text>
              <Text style={styles.summaryValue}>
                {selection.project?.project_name || "—"}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>SITE</Text>
              <Text style={styles.summaryValue}>
                {selection.site?.site_name || "—"}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>WORK</Text>
              <Text style={styles.summaryValue}>
                {selection.workDesc?.desc_name || "—"}
              </Text>
            </View>
          </View>
        </View>
      )}

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

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.assignmentButton}
          onPress={handleNavigateToAssignment}
          activeOpacity={0.8}
        >
          <Ionicons name="clipboard-outline" size={20} color="white" />
          <Text style={styles.assignmentButtonText}>Labour Assignment</Text>
        </TouchableOpacity>
      </View>

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
  
  selectionSummary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryItem: {
    width: '50%',
    marginBottom: 8,
    paddingRight: 8,
  },
  summaryLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },

  laboursList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 100,
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
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    backgroundColor: '#f3f4f6',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  assignmentButton: {
    backgroundColor: '#0f766e',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  assignmentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});