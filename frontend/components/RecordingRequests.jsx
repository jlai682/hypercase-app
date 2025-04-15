import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from "expo-router";

const RecordingRequests = ({ sentRequests, completedRequests, patient }) => {
  const router = useRouter();

  let parsedSentRequests = [];

  try {
    parsedSentRequests = JSON.parse(sentRequests);
  } catch (error) {
    console.error('Could not parse sentRequests:', error);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Pending Recordings</Text>
      {parsedSentRequests.length > 0 ? (
        parsedSentRequests.map((request) => (
          <View key={request.id} style={styles.card}>
            <Text style={styles.title}>{request.title}</Text>
            <Text style={styles.description}>{request.description}</Text>
            <TouchableOpacity
              onPress={() => router.push({
                pathname: '/record',
                params: {
                  request: JSON.stringify(request),
                  patient: patient,
                },
              })}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Record Now</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No sent requests.</Text>
      )}
    </ScrollView>
  );
};

export default RecordingRequests;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#041575',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    marginTop: 12,
    lineHeight: 22,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
});
