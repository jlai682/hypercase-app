import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Alert, Button } from 'react-native';
import AudioRecorder from '../components/AudioRecorder';
import { Audio } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';

export default function RecordScreen() {
  const [hasPermission, setHasPermission] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      if (hasPermission === null) {
        checkPermission();
      }
    }, [hasPermission])
  );

  const checkPermission = () => {
    Alert.alert(
      "Voice Recording Permission",
      "Do you allow this app to record your voice?",
      [
        {
          text: "No",
          onPress: () => setHasPermission(false),
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              const { status } = await Audio.requestPermissionsAsync();
              setHasPermission(status === 'granted');
              if (status !== 'granted') {
                Alert.alert(
                  'Permission Denied',
                  'You need to grant audio recording permissions to use this feature.'
                );
              }
            } catch (error) {
              console.error('Error requesting permission:', error);
              setHasPermission(false);
            }
          }
        }
      ]
    );
  };

  if (hasPermission === false) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Button title="I allow this app to record my voice" onPress={checkPermission} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AudioRecorder />
    </SafeAreaProvider>
  );
}