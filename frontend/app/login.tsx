import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';
import BackButton from '@/components/ui/BackButton';
import { showAlert } from '@/components/utils/alerts';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

type LoginType = 'patient' | 'provider';

const Login = (): React.JSX.Element => {
  const params = useLocalSearchParams();
  const loginType: LoginType = (params.loginType as LoginType) || 'patient';
  
  const router = useRouter();
  const { onLogin } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      showAlert('Validation Error', 'Please fill in both email and password');
      return;
    }

    try {
      const result = await onLogin(email, password, loginType);
      console.log('Login result:', result);
    } catch (error) {
      console.error('Login error caught in handleLogin:', error);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ alignSelf: 'flex-start', marginTop: 60, marginLeft: 30 }}>
        <BackButton />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {loginType === 'provider' ? 'Provider Login' : 'Patient Login'}
        </Text>

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="example@gmail.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={[styles.input, styles.inputText]}
          placeholder="password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleSignInButton
          onPress={() => {}}
          label="Sign in with Google"
        />
      </View>

      <View style={styles.registerContainer}>
        <TouchableOpacity 
          onPress={() => router.push({ 
            pathname: '/signup', 
            params: { signupType: loginType } 
          })}
        >
          <Text style={styles.registerText}>
            {"Don't have an account?"} <Text style={styles.registerLink}>Register Now</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    fontFamily: 'Figtree_700Bold',
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 300,
    marginVertical: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#999',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Figtree_400Regular',
  },
  registerText: {
    fontSize: 14,
    color: '#333',
  },
  registerLink: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    alignSelf: 'flex-start',
    width: 'auto',
  },
});

export default Login;