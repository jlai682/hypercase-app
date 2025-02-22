import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PatientLogin = () => {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Patient Login</Text>

                <TextInput
                    style={[styles.input, styles.inputText]}
                    placeholder="email"
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

                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>
            </View>

            {/* Register Section at the Bottom */}
            <View style={styles.registerContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('patientSignup')}>
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

export default PatientLogin;
