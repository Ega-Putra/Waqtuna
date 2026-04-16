import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#000000',
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabItem,
        tabBarButton: (props: BottomTabBarButtonProps) => <HapticTab {...props} />,
        tabBarActiveBackgroundColor: '#AEB7A6',
        tabBarInactiveBackgroundColor: 'transparent',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Pengingat',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="alarm-light-outline" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Alat Bantu',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-city-outline" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={40} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 80,
    backgroundColor: '#E7F0DE',
    borderTopWidth: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 18,
  },
  tabItem: {
    marginHorizontal: 10,
    marginVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
