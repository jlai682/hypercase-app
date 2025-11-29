import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * LoggedOutView Component
 * Displays a message when user is logged out and provides a button to navigate to login
 *
 * @param {string} loginRoute - The route to navigate to when the login button is pressed (default: '/login')
 */
export default function LoggedOutView({ loginRoute = '/' }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.message}>You were logged out. Please log back in.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push(loginRoute)}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#F9FAFB',
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
    color: '#1F2937',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
