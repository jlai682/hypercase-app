import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import config from '../config';
import { router } from 'expo-router';
import { useLocalSearchParams } from "expo-router";

import { useRouter, useRoute } from 'expo-router';


const signup = () => {

    const { signupType } = useLocalSearchParams();


    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [age, setAge] = useState('');

    // Form Validation function
    const validateForm = () => {
        console.log("Validating form...");
        if (signupType === "patient") {
            if (!firstName || !lastName || !email || !password || !age) {
                Alert.alert('Validation Error', 'Please fill all fields');
                return false;
            }
            if (isNaN(age) || age <= 0) {
                Alert.alert('Validation Error', 'Please enter a valid age');
                return false;
            }
        }
        else {
            if (!firstName || !lastName || !email || !password){
                Alert.alert('Validation Error', 'Please fill all fields');
                return false;
            }
        }

        console.log("Validation passed!");
        return true;
    };
    

    const handleSignup = async () => {
        console.log("Signup button clicked")
        if (!validateForm()) return;  // Stop if validation fails

        let signupUrl = "" 
        if (signupType === "patient") {
            signupUrl = "patientManagement/register/"
        }
        else {
            signupUrl = "providerManagement/register/"
        }

        try {
            const endpoint = signupType === "patient" 
            ? `${config.BACKEND_URL}/api/patientManagement/register/`
            : `${config.BACKEND_URL}/api/providerManagement/register/`;

            const requestBody = signupType === "patient"
                ? { email, password, firstName, lastName, age: Number(age) }
                : { email, password, firstName, lastName };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                router.push('home')
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
            <Text style={styles.title}>{signupType === "patient" ? 'Patient Signup' : 'Provider Signup'}</Text>
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

{           signupType === "patient" && (
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
        placeholderTextColor: "rgba(0, 0, 0, 0.4)"
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

export default signup;
