import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  StyleSheet,
  KeyboardAvoidingView,   
  Platform,               
  ScrollView               
} from 'react-native';
import { useAuth } from '../components/context/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import BackButton from '../components/BackButton';

const Signup = () => {
    const { onRegister } = useAuth();
    const { signupType } = useLocalSearchParams();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');

    const validateForm = () => {
        if (!firstName || !lastName || !email || !password || (signupType === 'patient' && (!age || isNaN(Number(age))))) {
            Alert.alert('Validation Error', 'Please fill all fields correctly');
            return false;
        }
        return true;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;
        try {
            console.log("Signup type: ", signupType)
            await onRegister(email, password, firstName, lastName, signupType, age);
            console.log("On Reg Success")
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
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
                    value={firstName}
                    onChangeText={setFirstName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {signupType === 'patient' && (
                    <TextInput
                        style={styles.input}
                        placeholder="Age"
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                    />
                )}
                <TextInput
                    style={styles.input}
                    placeholder="Password"
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
        paddingBottom: 40,  // Extra padding at bottom
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
    button: {
        width: 300,
        height: 50,
        backgroundColor: '#041575',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginVertical: 10,
        marginBottom: 20,  // Extra margin at bottom
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Figtree_400Regular',
    },
});

export default Signup;