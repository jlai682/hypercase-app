import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";


const RecordingRequests = ({ sentRequests, completedRequests, onSelectRequest, patient }) => {

  const [expandedId, setExpandedId] = useState(null);
    const router = useRouter();
  

  let parsedSentRequests = [];

  try {
    parsedSentRequests = JSON.parse(sentRequests);
  } catch (error) {
    console.error('Could not parse sentRequests:', error);
  }

  const toggleDescription = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Pending Recordings</Text>
      {parsedSentRequests.length > 0 ? (
        parsedSentRequests.map((request) => (
          <View key={request.id} style={styles.requestItem}>
            <TouchableOpacity
              onPress={() => {
                toggleDescription(request.id);
                onSelectRequest(request);
              }}
            >
              <Text style={styles.title}>{request.title}</Text>
            </TouchableOpacity>
            {expandedId === request.id && (
              <>
                <Text style={styles.description}>{request.description}</Text>
                <TouchableOpacity
                  onPress={() => router.push({
                    pathname: '/record',
                    params: {
                        request: JSON.stringify(request),
                        patient: patient
                    }
                  })}
                  style={styles.recordNowButton}
                >
                  <Text style={styles.recordNowText}>Record Now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.empty}>No sent requests.</Text>
      )}
    </ScrollView>
  );
};

export default RecordingRequests;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  requestItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
  empty: {
    fontStyle: 'italic',
    color: '#888',
  },
  recordNowButton: {
    marginTop: 10,
    paddingVertical: 10,
    backgroundColor: '#4A90E2',
    borderRadius: 6,
    alignItems: 'center',
  },
  recordNowText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
