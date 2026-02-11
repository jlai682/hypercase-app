import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Href, router } from 'expo-router';
import { BackButtonProps } from '@/types';

const BackButton = ({ route }: BackButtonProps) => {
  const handlePress = () => {
    if (route) {
      router.push(route as Href); // Use Expo Router's push method
    } else {
      router.back(); // Use Expo Router's back method
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.6}
        onPress={handlePress}
      >
        <Text style={styles.text}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#041575',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 2,
    paddingBottom: 2
  },
  text: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
  },
});

export default BackButton;