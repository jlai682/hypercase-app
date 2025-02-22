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
                placeholder="First Name"
                value={name}
                onChangeText={setName}
            />
            <TextInput
                style={styles.input}
                placeholder="Last Name"
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
        backgroundColor: '#cae7ff',
        width: '100%',
    },
    content: {
        flex: 1, // Takes available space
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    registerContainer: {
        position:'absolute',
        bottom: 0,
        width: '100%',
        alignItems: 'center',
        paddingBottom: 30, // Space from the bottom
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
        placeholderTextColor: "rgba(0, 0, 0, 0.4)" // 50% opacity black

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
});

export default patientSignup;
