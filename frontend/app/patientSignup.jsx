import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import config from '../config';


const patientSignup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');

    const handleSignup = async () => {
        try {
            const response = await fetch(`${config.BACKEND_URL}/api/patientManagement/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    age: Number(age),
                }),
                
            });
    
            const data = await response.json();
    
            if (response.ok) {
                Alert.alert('Signup Successful', 'You can now log in.');
            } else {
                Alert.alert('Signup Failed', data.error || 'Please try again.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };
    

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Patient Signup</Text>

            <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
            />

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
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    input: {
        width: '100%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 15,
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default patientSignup;
