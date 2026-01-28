import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#041575',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 24 : 12,
          paddingTop: 12,
          paddingHorizontal: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Figtree_400Regular',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      {/* Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Recordings Tab */}
      <Tabs.Screen
        name="recordings/index"
        options={{
          title: 'Recordings',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? "mic" : "mic-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Surveys Tab */}
      <Tabs.Screen
        name="surveys/index"
        options={{
          title: 'Surveys',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? "clipboard" : "clipboard-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Hidden screens (don't show in tab bar) */}
      <Tabs.Screen
        name="consent"
        options={{
          href: null,
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

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: '#EEF2FF',
  },
});
