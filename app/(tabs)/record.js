import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React from 'react';
import AudioRecorder from '../../components/AudioRecorder';

const Stack = createNativeStackNavigator();

export default function RecordScreen() {
  return (
    <SafeAreaProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="AudioRecorder"
          component={AudioRecorder}
          options={{
            title: 'Audio Recorder',
            headerStyle: {
              backgroundColor: '#1db954',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}

