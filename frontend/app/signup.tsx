import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  KeyboardAvoidingView,   
  Platform,               
  ScrollView               
} from 'react-native';
import { useAuth } from '@/components/auth/AuthContext';
import BackButton from '@/components/ui/BackButton';
import { showAlert } from '@/components/utils/alerts';
import { useLocalSearchParams } from 'expo-router';

type SignupType = 'patient' | 'provider';

const Signup = (): React.JSX.Element => {
  const { onRegister } = useAuth();
  const { signupType: paramSignupType } = useLocalSearchParams();
  const signupType: SignupType = (paramSignupType as SignupType) || 'patient';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [age, setAge] = useState<string>('');

  const validateForm = (): boolean => {
    if (!firstName || !lastName || !email || !password || (signupType === 'patient' && (!age || isNaN(Number(age))))) {
      showAlert('Validation Error', 'Please fill all fields correctly');
      return false;
    }
    return true;
  };

  const handleSignup = async (): Promise<void> => {
    if (!validateForm()) return;
    try {
      console.log("Signup type: ", signupType);
      await onRegister(email, password, firstName, lastName, signupType, age);
      console.log("Successfuly registered!");
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Something went wrong. Please try again.');
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>
          {signupType === 'patient' ? 'Patient Signup' : 'Provider Signup'}
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="#041575"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="#041575"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#041575"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {signupType === 'patient' && (
          <TextInput
            style={styles.input}
            placeholder="Age"
            placeholderTextColor="#041575"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#041575"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
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
  button: {
    width: 300,
    height: 50,
    backgroundColor: '#041575',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Figtree_400Regular',
  },
});

export default Signup;