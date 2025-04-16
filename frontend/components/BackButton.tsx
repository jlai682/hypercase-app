import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useColorScheme } from 'react-native';

const BackButton = ({ label = 'Back' }) => {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isDarkMode ? styles.buttonDark : styles.buttonLight,
        ]}
        activeOpacity={0.6}
        onPress={() => navigation.goBack()}
      >
        <Text
          style={[
            styles.text,
            isDarkMode ? styles.textDark : styles.textLight,
          ]}
        >
          ← {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonLight: {
    backgroundColor: '#f2f2f7',
  },
  buttonDark: {
    backgroundColor: '#1c1c1e',
  },
  text: {
    fontSize: 17,
    fontWeight: '500',
  },
  textLight: {
    color: '#007aff',
  },
  textDark: {
    color: '#0a84ff',
  },
});

export default BackButton;