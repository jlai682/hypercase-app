import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useAuth } from './context/AuthContext'; // Import the useAuth hook
import { useLocalSearchParams } from 'expo-router';

const Signup = () => {
    const { onRegister } = useAuth(); // Destructure onRegister from context
    const { signupType } = useLocalSearchParams(); // Get the signup type from params

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
        if (!validateForm()) return;  // Stop if validation fails
        try {
            console.log("Signup type: ", signupType)
            await onRegister(email, password, firstName, lastName, signupType, age); // Call onRegister from context with signupType
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{signupType === 'patient' ? 'Patient Signup' : 'Provider Signup'}</Text>
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
        placeholderTextColor: "rgba(0, 0, 0, 0.4)",
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
});

export default Signup;
