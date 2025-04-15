import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const NavBar = ({ patient }) => {
  const router = useRouter();

  const handleProfilePress = () => {
    if (patient) {
      router.push({
        pathname: '/profile',
        params: {
          patient: JSON.stringify(patient)
        }
      });
    } else {
      // Navigate to profile without data, or show an alert
      console.log("Warning: Patient data not available");
      router.push('/patientDash'); // Redirect to dashboard instead
    }
  };

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.push('../patientDash')}>
        <Ionicons name="home-outline" size={24} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.push('../record')}>
        <Ionicons name="mic-outline" size={24} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={() => router.push('../survey')}>
        <Ionicons name="document-text-outline" size={24} color="#333" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.tabItem} onPress={handleProfilePress}>
        <Ionicons name="person-outline" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#d6e6ff',
    height: 60,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    justifyContent: 'space-around',
    alignItems: 'center',
    bottom: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
});

export default NavBar;