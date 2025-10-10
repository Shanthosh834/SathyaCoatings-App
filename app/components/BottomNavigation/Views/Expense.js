import React from 'react';
import { 
  View, 
  Text, 
  Alert
} from 'react-native';

// Expense component - placeholder for future implementation
export const ExpenseHistory = () => {
  return (
    <View>
      <Text>Expense History Component</Text>
    </View>
  );
};

// Function to handle Expense card press
export const handleExpensePress = () => {
  Alert.alert('Coming Soon', 'Expense history will be available soon');
};

export default ExpenseHistory;