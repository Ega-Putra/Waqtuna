import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

function FigmaTabButton(props: BottomTabBarButtonProps) {
  const selected = Boolean(props.accessibilityState?.selected);

  return (
    <HapticTab {...props} style={[styles.tabButton, props.style]}>
      <View style={[styles.tabInner, selected && styles.tabInnerActive]}>{props.children}</View>
    </HapticTab>
  );
}

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
        tabBarButton: (props) => <FigmaTabButton {...props} />,
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
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabInner: {
    width: 88,
    minHeight: 64,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabInnerActive: {
    backgroundColor: '#AEB7A6',
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    marginTop: 2,
  },
});
