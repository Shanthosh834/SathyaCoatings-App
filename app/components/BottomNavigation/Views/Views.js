import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Alert
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSelection } from '../../../SelectionContext';

// Import Material components
import { 
  MaterialUsageHistoryModal, 
  AcknowledgementSummaryModal, 
  SubOptionsModal 
} from './Material';

// Import other module handlers
import { handleExpensePress } from './Expense';
import { handleWorkPress } from './Work';
import { handleLabourPress } from './Labour';

// Selection Info Header Component
const SelectionInfoHeader = ({ selection }) => (
  <View className="px-4 py-2 mx-4 mb-4 bg-white border border-gray-400 rounded-lg">
    <View className="flex-row flex-wrap">
      <View className="w-1/2 pr-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">COMPANY</Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.company?.company_name || "—"}
        </Text>
      </View>
      <View className="w-1/2 pl-2 mb-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">PROJECT</Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.project?.project_name || "—"}
        </Text>
      </View>
      <View className="w-1/2 pr-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">SITE</Text>
        <Text className="text-xs font-semibold text-gray-900">
          {selection?.site?.site_name || "—"}
        </Text>
      </View>
      <View className="w-1/2 pl-2">
        <Text className="text-[10px] uppercase tracking-wide text-gray-500">WORK</Text>
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
  const { selection } = useSelection();
  const [subOptionsVisible, setSubOptionsVisible] = useState(false);
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [acknowledgementModalVisible, setAcknowledgementModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleMaterialCardPress = useCallback(() => {
    setSubOptionsVisible(true);
  }, []);

  const handleUsageHistory = useCallback(() => {
    setSubOptionsVisible(false);
    setUsageModalVisible(true);
  }, []);

  const handleAcknowledgementHistory = useCallback(() => {
    setSubOptionsVisible(false);
    setAcknowledgementModalVisible(true);
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
            onPress={handleExpensePress}
          />
          <ViewCard
            title="Work"
            iconName="clipboard-outline"
            description="View work completion history"
            onPress={handleWorkPress}
          />
          <ViewCard
            title="Labour"
            iconName="people-outline"
            description="View labour assignment records"
            onPress={handleLabourPress}
          />
        </View>
      </ScrollView>

      <SubOptionsModal
        visible={subOptionsVisible}
        onClose={() => setSubOptionsVisible(false)}
        onSelectUsage={handleUsageHistory}
        onSelectAcknowledgement={handleAcknowledgementHistory}
      />

      <MaterialUsageHistoryModal
        visible={usageModalVisible}
        onClose={() => setUsageModalVisible(false)}
        selection={selection}
      />

      <AcknowledgementSummaryModal
        visible={acknowledgementModalVisible}
        onClose={() => setAcknowledgementModalVisible(false)}
        selection={selection}
      />
    </View>
  );
}

export default function Views() {
  return <ViewsMainScreen />;
}