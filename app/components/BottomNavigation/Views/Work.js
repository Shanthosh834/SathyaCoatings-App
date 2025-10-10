import React from 'react';
import { 
  View, 
  Text, 
  Alert
} from 'react-native';

// Work component - placeholder for future implementation
export const WorkHistory = () => {
  return (
    <View>
      <Text>Work History Component</Text>
    </View>
  );
};

// Function to handle Work card press
export const handleWorkPress = () => {
  Alert.alert('Coming Soon', 'Work history will be available soon');
};

export default WorkHistory;