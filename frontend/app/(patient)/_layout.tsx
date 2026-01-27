import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#041575',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E5EA',
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Recordings Tab */}
      <Tabs.Screen
        name="recordings/index"
        options={{
          title: 'Recordings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />

      {/* Surveys Tab */}
      <Tabs.Screen
        name="surveys/index"
        options={{
          title: 'Surveys',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="clipboard" size={size} color={color} />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden screens (don't show in tab bar) */}
      <Tabs.Screen
        name="consent"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="recordings/record"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="recordings/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="surveys/respond/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="surveys/view/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/terms"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/consent-view"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/physicians"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/medical-history"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
