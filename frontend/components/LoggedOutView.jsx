import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

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
    backgroundColor: '#cae7ff',
  },
  message: {
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 24,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'Figtree_400Regular',
  },
  button: {
    backgroundColor: '#041575',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 12,
    width: '100%',
    maxWidth: 300,
    boxShadow: '0px 3px 4px 0px rgba(4, 21, 117, 0.2)',
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'Figtree_400Regular',
  },
});
