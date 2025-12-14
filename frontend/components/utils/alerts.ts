import { Alert, Platform } from 'react-native';

/**
 * Platform-aware alert function that uses native alerts on mobile and browser alerts on web
 * @param title - The alert title
 * @param message - The alert message
 */
export const showAlert = (title: string, message: string): void => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};
