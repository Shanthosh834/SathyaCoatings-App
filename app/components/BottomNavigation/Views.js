import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

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

export default function Views() {
  const navigation = useNavigation();

  const handleCardPress = (cardName) => {
    // Navigate to different screens based on card pressed
    switch (cardName) {
      case 'Dashboard':
        // navigation.navigate('Dashboard');
        console.log('Navigate to Dashboard');
        break;
      case 'Reports':
        // navigation.navigate('Reports');
        console.log('Navigate to Reports');
        break;
      case 'Analytics':
        // navigation.navigate('Analytics');
        console.log('Navigate to Analytics');
        break;
      case 'Settings':
        // navigation.navigate('Settings');
        console.log('Navigate to Settings');
        break;
      default:
        console.log('Unknown card pressed');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Views</Text>
          <Text style={styles.subtitle}>Choose your view option</Text>
        </View>

        <View style={styles.cardGrid}>
          <ViewCard 
            title="Dashboard" 
            iconName="speedometer-outline" 
            onPress={() => handleCardPress('Dashboard')}
            description="Project Overview"
          />
          <ViewCard 
            title="Reports" 
            iconName="document-text-outline" 
            onPress={() => handleCardPress('Reports')}
            description="Generate Reports"
          />
          <ViewCard 
            title="Analytics" 
            iconName="analytics-outline" 
            onPress={() => handleCardPress('Analytics')}
            description="Data Insights"
          />
          <ViewCard 
            title="Settings" 
            iconName="settings-outline" 
            onPress={() => handleCardPress('Settings')}
            description="App Configuration"
          />
        </View>
      </ScrollView>
    </View>
  );
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
  },
});