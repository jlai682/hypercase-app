import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from './context/AuthContext'; // Import the useAuth hook
import { useNavigation } from '@react-navigation/native'; // Import navigation hook
import BackButton from '../components/BackButton';

const Login = () => {
  const { loginType = 'patient' } = useLocalSearchParams();
  const router = useRouter();
  const { onLogin } = useAuth(); // Get onLogin from context
  const navigation = useNavigation(); // Use the navigation hook

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please fill in both email and password');
      return;
    }

    try {
      await onLogin(email, password, loginType); // Use onLogin from the context
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };




  return (
    <View style={styles.container}>

      <View style={{ alignSelf: 'flex-start', marginTop: 60, marginLeft: 30 }}>
        <BackButton />
      </View>



      <View style={styles.content}>
        <Text style={styles.title}>{loginType === 'provider' ? 'Provider Login' : 'Patient Login'}</Text>

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.registerContainer}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/signup', params: { signupType: loginType } })}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.registerLink}>Register Now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#cae7ff',
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  registerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    paddingBottom: 30,
  },
  title: {
    fontSize: 35,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 20,
    color: '#041575',
  },
  input: {
    width: '80%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  inputText: {
    fontSize: 14,
  },
  button: {
    width: 300,
    height: 50,
    backgroundColor: '#041575',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Figtree_400Regular',
  },
  registerText: {
    fontSize: 14,
    color: '#333',
  },
  registerLink: {
    color: '#0077CC',
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    alignSelf: 'flex-start', // Ensures alignment to the left
    width: 'auto', // Prevents stretching
  },
});

export default Login;
