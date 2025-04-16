import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const BackButton = ({ route }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (route) {
      navigation.navigate(route); // Navigate to the provided route
    } else {
      navigation.goBack(); // Default to going back if no route is provided
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
    backgroundColor: '#00205B',
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
