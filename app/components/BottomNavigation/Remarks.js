import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Keyboard,
  SafeAreaView,
  Dimensions,
} from 'react-native';

// Fake data for different categories
const fakeData = {
  material: [
    { id: 1, name: 'Cement', quantity: '500 bags', status: 'In Stock', lastUpdated: '2024-01-15' },
    { id: 2, name: 'Steel Rods', quantity: '2000 kg', status: 'Low Stock', lastUpdated: '2024-01-14' },
    { id: 3, name: 'Bricks', quantity: '10000 units', status: 'In Stock', lastUpdated: '2024-01-13' },
    { id: 4, name: 'Sand', quantity: '50 tons', status: 'Ordered', lastUpdated: '2024-01-12' },
  ],
  labour: [
    { id: 1, name: 'John Smith', role: 'Mason', status: 'Present', hours: 8 },
    { id: 2, name: 'Mike Johnson', role: 'Carpenter', status: 'Present', hours: 7 },
    { id: 3, name: 'Sarah Williams', role: 'Electrician', status: 'Absent', hours: 0 },
    { id: 4, name: 'Tom Brown', role: 'Plumber', status: 'Present', hours: 6 },
  ],
  workCompletion: [
    { id: 1, task: 'Foundation Work', progress: 100, status: 'Completed', date: '2024-01-10' },
    { id: 2, task: 'Wall Construction', progress: 75, status: 'In Progress', date: '2024-01-15' },
    { id: 3, task: 'Electrical Wiring', progress: 30, status: 'In Progress', date: '2024-01-14' },
    { id: 4, task: 'Plumbing', progress: 0, status: 'Not Started', date: 'TBD' },
  ],
  expenseEntry: [
    { id: 1, category: 'Material', amount: 50000, description: 'Cement purchase', date: '2024-01-15' },
    { id: 2, category: 'Labour', amount: 25000, description: 'Weekly wages', date: '2024-01-14' },
    { id: 3, category: 'Equipment', amount: 15000, description: 'Tool rental', date: '2024-01-13' },
    { id: 4, category: 'Transport', amount: 5000, description: 'Material delivery', date: '2024-01-12' },
  ],
};

// Bot responses based on keywords
const getBotResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('material')) {
    const materials = fakeData.material.map(m => 
      `${m.name}: ${m.quantity} (${m.status})`
    ).join('\n');
    return `Here's the current material status:\n\n${materials}`;
  }
  
  if (lowerMessage.includes('labour') || lowerMessage.includes('labor')) {
    const workers = fakeData.labour.map(l => 
      `${l.name} (${l.role}): ${l.status} - ${l.hours}hrs`
    ).join('\n');
    return `Today's labour attendance:\n\n${workers}`;
  }
  
  if (lowerMessage.includes('work') || lowerMessage.includes('completion')) {
    const tasks = fakeData.workCompletion.map(w => 
      `${w.task}: ${w.progress}% - ${w.status}`
    ).join('\n');
    return `Work completion status:\n\n${tasks}`;
  }
  
  if (lowerMessage.includes('expense')) {
    const totalExpense = fakeData.expenseEntry.reduce((sum, e) => sum + e.amount, 0);
    const expenses = fakeData.expenseEntry.map(e => 
      `${e.category}: ₹${e.amount} - ${e.description}`
    ).join('\n');
    return `Recent expenses (Total: ₹${totalExpense}):\n\n${expenses}`;
  }
  
  if (lowerMessage.includes('help')) {
    return 'I can help you with:\n• Material status\n• Labour attendance\n• Work completion\n• Expense entries\n\nJust ask me about any of these!';
  }
  
  return "I can help you with material status, labour attendance, work completion, and expense entries. What would you like to know?";
};

const { height: screenHeight } = Dimensions.get('window');

export default function SiteInchargeChatBot() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your site management assistant. How can I help you today?", isBot: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      isBot: false
    };

    const botResponse = {
      id: messages.length + 2,
      text: getBotResponse(inputText),
      isBot: true
    };

    setMessages([...messages, userMessage, botResponse]);
    setInputText('');
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Text style={styles.headerText}>Site Incharge Assistant</Text>
      </View> */}

      <View style={styles.chatContainer}>
        <ScrollView 
          ref={scrollViewRef}
          style={[
            styles.messagesContainer,
            { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }
          ]}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.isBot ? styles.botMessage : styles.userMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                message.isBot ? styles.botText : styles.userText
              ]}>
                {message.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={[
          styles.inputContainer,
          {
            bottom: keyboardHeight > 0 ? keyboardHeight : 0,
            position: keyboardHeight > 0 ? 'absolute' : 'relative',
            left: 0,
            right: 0,
          }
        ]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about materials, labour, work, or expenses..."
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline={false}
            autoCorrect={false}
            blurOnSubmit={false}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 15,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2196F3',
  },
  messageText: {
    fontSize: 16,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: 'white',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 25,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});