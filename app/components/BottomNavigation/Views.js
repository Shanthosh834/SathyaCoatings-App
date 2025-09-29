  import React, { useState, useCallback } from 'react';
  import { 
    View, 
    Text, 
    TouchableOpacity, 
    StyleSheet, 
    ScrollView, 
    Modal, 
    FlatList,
    ActivityIndicator,
    RefreshControl
  } from 'react-native';
  import { useNavigation } from '@react-navigation/native';
  import Ionicons from '@expo/vector-icons/Ionicons';

  // Sample history data - replace with your actual API calls
  const sampleHistoryData = {
    material: [
      { id: 1, date: '2024-01-15', item: 'Cement Bags', quantity: '50', site: 'Site A' },
      { id: 2, date: '2024-01-14', item: 'Steel Bars', quantity: '200kg', site: 'Site B' },
      { id: 3, date: '2024-01-13', item: 'Bricks', quantity: '1000', site: 'Site A' },
    ],
    expense: [
      { id: 1, date: '2024-01-15', category: 'Transportation', amount: '₹5,000', site: 'Site A' },
      { id: 2, date: '2024-01-14', category: 'Equipment Rent', amount: '₹12,000', site: 'Site B' },
      { id: 3, date: '2024-01-13', category: 'Fuel', amount: '₹3,500', site: 'Site A' },
    ],
    work: [
      { id: 1, date: '2024-01-15', task: 'Foundation Work', progress: '75%', site: 'Site A' },
      { id: 2, date: '2024-01-14', task: 'Brick Laying', progress: '60%', site: 'Site B' },
      { id: 3, date: '2024-01-13', task: 'Plastering', progress: '90%', site: 'Site A' },
    ],
    labour: [
      { id: 1, date: '2024-01-15', worker: 'John Doe', hours: '8', site: 'Site A' },
      { id: 2, date: '2024-01-14', worker: 'Jane Smith', hours: '6', site: 'Site B' },
      { id: 3, date: '2024-01-13', worker: 'Mike Johnson', hours: '8', site: 'Site A' },
    ],
  };

  // History Modal Component
  const HistoryModal = ({ visible, onClose, title, data, type }) => {
    const [loading, setLoading] = useState(false);

    const renderHistoryItem = ({ item }) => {
      switch (type) {
        case 'material':
          return (
            <View style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemTitle}>{item.item}</Text>
                <Text style={styles.historyItemDate}>{item.date}</Text>
              </View>
              <View style={styles.historyItemDetails}>
                <Text style={styles.historyItemDetail}>Quantity: {item.quantity}</Text>
                <Text style={styles.historyItemDetail}>Site: {item.site}</Text>
              </View>
            </View>
          );
        case 'expense':
          return (
            <View style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemTitle}>{item.category}</Text>
                <Text style={styles.historyItemDate}>{item.date}</Text>
              </View>
              <View style={styles.historyItemDetails}>
                <Text style={styles.historyItemDetail}>Amount: {item.amount}</Text>
                <Text style={styles.historyItemDetail}>Site: {item.site}</Text>
              </View>
            </View>
          );
        case 'work':
          return (
            <View style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemTitle}>{item.task}</Text>
                <Text style={styles.historyItemDate}>{item.date}</Text>
              </View>
              <View style={styles.historyItemDetails}>
                <Text style={styles.historyItemDetail}>Progress: {item.progress}</Text>
                <Text style={styles.historyItemDetail}>Site: {item.site}</Text>
              </View>
            </View>
          );
        case 'labour':
          return (
            <View style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyItemTitle}>{item.worker}</Text>
                <Text style={styles.historyItemDate}>{item.date}</Text>
              </View>
              <View style={styles.historyItemDetails}>
                <Text style={styles.historyItemDetail}>Hours: {item.hours}</Text>
                <Text style={styles.historyItemDetail}>Site: {item.site}</Text>
              </View>
            </View>
          );
        default:
          return null;
      }
    };

    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title} History</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#14b8a6" />
                  <Text style={styles.loadingText}>Loading history...</Text>
                </View>
              ) : (
                <FlatList
                  data={data}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.historyList}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Ionicons name="document-outline" size={48} color="#9ca3af" />
                      <Text style={styles.emptyText}>No history found</Text>
                    </View>
                  }
                />
              )}
            </View>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={onClose} style={styles.closeModalButton}>
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Reusable Card Component
  const ViewCard = ({ title, iconName, onPress, description }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.viewCard}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.viewCardHeader}>
        <Text style={styles.viewCardTitle}>{title}</Text>
      </View>

      {/* Icon */}
      <View style={styles.viewCardIconContainer}>
        <Ionicons name={iconName} size={36} color="#6b7280" />
        {description && (
          <Text style={styles.viewCardDescription}>{description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Main Views Screen Component
  function ViewsMainScreen() {
    const [modalState, setModalState] = useState({
      visible: false,
      title: '',
      data: [],
      type: '',
    });
    const [refreshing, setRefreshing] = useState(false);

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

    const handleRefresh = useCallback(async () => {
      setRefreshing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRefreshing(false);
    }, []);

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Overall Summary</Text>
            {/* <Text style={styles.subtitle}>View your project records</Text> */}
          </View>

          <View style={styles.cardGrid}>
            <ViewCard
              title="Material"
              iconName="cube-outline"
              description="View material dispatch history"
              onPress={() => openHistoryModal('material', 'Material')}
            />
            <ViewCard
              title="Expense"
              iconName="cash-outline"
              description="View expense records"
              onPress={() => openHistoryModal('expense', 'Expense')}
            />
            <ViewCard
              title="Work"
              iconName="clipboard-outline"
              description="View work completion history"
              onPress={() => openHistoryModal('work', 'Work')}
            />
            <ViewCard
              title="Labour"
              iconName="people-outline"
              description="View labour assignment records"
              onPress={() => openHistoryModal('labour', 'Labour')}
            />
          </View>
        </ScrollView>

        {/* History Modal */}
        <HistoryModal
          visible={modalState.visible}
          onClose={closeHistoryModal}
          title={modalState.title}
          data={modalState.data}
          type={modalState.type}
        />
      </View>
    );
  }

  // Main Export: Views Component
  export default function Views() {
    return <ViewsMainScreen />;
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f3f4f6',
    },
    contentContainer: {
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: '#1e293b',
      textAlign: 'center',
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: '#64748b',
      textAlign: 'center',
      fontWeight: '400',
    },
    cardGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    viewCard: {
      width: "48%",
      marginBottom: 20,
      borderRadius: 12,
      backgroundColor: "#ffffff",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: "#e5e7eb",
      overflow: "hidden",
      
    },
    viewCardHeader: {
      height: 45,
      borderBottomWidth: 1,
      borderColor: "#e5e7eb",
      justifyContent: "center",
      backgroundColor: "#f9fafb",
    },
    viewCardTitle: {
      fontWeight: "600",
      textAlign: "center",
      color: "#374151",
      fontSize: 18,
      letterSpacing: 0.5,
    },
    viewCardIconContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
      backgroundColor: "white",
    },
    viewCardDescription: {
      fontSize: 12,
      color: "#6b7280",
      textAlign: "center",
      marginTop: 8,
      fontWeight: "400",
      paddingHorizontal: 8,
    },

    // Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: 'white',
      borderRadius: 12,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#14b8a6',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: 'white',
    },
    closeButton: {
      padding: 4,
    },
    modalContent: {
      flex: 1,
      maxHeight: 400,
    },
    modalFooter: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: '#e5e7eb',
    },
    closeModalButton: {
      backgroundColor: '#6b7280',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    closeModalButtonText: {
      color: 'white',
      fontWeight: '600',
      fontSize: 16,
    },

    // History List Styles
    historyList: {
      padding: 16,
    },
    historyItem: {
      backgroundColor: '#f9fafb',
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#14b8a6',
    },
    historyItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    historyItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#1f2937',
      flex: 1,
    },
    historyItemDate: {
      fontSize: 12,
      color: '#6b7280',
      fontWeight: '500',
    },
    historyItemDetails: {
      gap: 4,
    },
    historyItemDetail: {
      fontSize: 14,
      color: '#4b5563',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#64748b',
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      color: '#9ca3af',
      fontWeight: '500',
    },
  });