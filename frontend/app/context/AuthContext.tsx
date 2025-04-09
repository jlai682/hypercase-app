import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import config from '../../config';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { Platform } from 'react-native';

const isTokenExpired = (token: string) => {
    if (!token) return true;
    const { exp } = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return exp < currentTime;
};

// Helper function to store tokens
const storeToken = async (token: string, tokenType: 'access' | 'refresh') => {
    const key = tokenType === 'access' ? 'my-jwt' : 'refreshToken'; // Set key based on token type
    if (Platform.OS === 'web') {
        localStorage.setItem(key, token);  // For web, use localStorage
    } else {
        await SecureStore.setItemAsync(key, token);  // For mobile, use SecureStore
    }
};

// Helper function to load tokens
const loadToken = async (tokenType: 'access' | 'refresh') => {
    const key = tokenType === 'access' ? 'my-jwt' : 'refreshToken';  // Key based on token type
    if (Platform.OS === 'web') {
        return localStorage.getItem(key);  // For web, use localStorage
    } else {
        return await SecureStore.getItemAsync(key);  // For mobile, use SecureStore
    }
};

// Function to refresh access token using refresh token
const refreshAccessToken = async (refreshToken) => {
    try {
        const response = await fetch(`${config.BACKEND_URL}/api/token/refresh/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            await storeToken(data.access, 'access');  // Store new access token
            return data.access;  // Return the new token to the caller
        } else {
            console.log('Unable to refresh token');
            throw new Error('Unable to refresh token');
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;  // Let the caller handle the error
    }
};

interface AuthProps {
    authState: { token: string | null; authenticated: boolean | null };
    onRegister: (email: string, password: string, firstName: string, lastName: string, signupType: string, age?: string) => Promise<any>;
    onLogin: (email: string, password: string, loginType: string) => Promise<any>;
    onLogout: () => Promise<any>;
}

const AuthContext = createContext<AuthProps | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({ token: null, authenticated: null });
    const router = useRouter();

    // Load token from secure storage when the app starts
    useEffect(() => {
        const initializeAuthState = async () => {
            const storedToken = await loadToken('access');  // Load the access token using loadToken helper
            if (storedToken && !isTokenExpired(storedToken)) {
                setAuthState({ token: storedToken, authenticated: true });
            } else {
                setAuthState({ token: null, authenticated: false });
                if (storedToken) {
                    Alert.alert("Session Expired", "Please log in again.");
                }
            }
        };

        initializeAuthState();
    }, []);

    const onRegister = async (email: string, password: string, firstName: string, lastName: string, signupType: string, age?: string) => {
        try {
            const endpoint = signupType === 'patient'
                ? `${config.BACKEND_URL}/api/patientManagement/register/`
                : `${config.BACKEND_URL}/api/providerManagement/register/`;

            const requestBody = signupType === 'patient'
                ? { email, password, firstName, lastName, age: Number(age) }
                : { email, password, firstName, lastName };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("data received: ", data);
                await storeToken(data.access, 'access');  // Store access token
                await storeToken(data.refresh, 'refresh');  // Store refresh token
                setAuthState({ token: data.access, authenticated: true });
                if (signupType === "provider") {
                    router.push("/providerDash");
                } else {
                    router.push("/patientDash");
                }
            } else {
                Alert.alert('Signup Failed', data.error || 'Please try again.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    const onLogin = async (email: string, password: string, loginType: string) => {
        try {
            const endpoint = loginType === 'provider'
                ? `${config.BACKEND_URL}/api/providerManagement/login/`
                : `${config.BACKEND_URL}/api/patientManagement/login/`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("Received data:", data);

            if (response.ok) {
                // Store access and refresh tokens using the storeToken helper
                await storeToken(data.access, 'access');
                await storeToken(data.refresh, 'refresh');

                // Handle token expiration and auto-refresh
                if (isTokenExpired(data.access)) {
                    console.log('Access token expired, refreshing...');
                    const newAccessToken = await refreshAccessToken(data.refresh);
                    await storeToken(newAccessToken, 'access');  // Store the refreshed access token
                }

                // Update auth state
                setAuthState({ token: data.access, authenticated: true });

                // Navigate based on login type
                if (loginType === 'provider') {
                    router.push('/providerDash');
                } else {
                    router.push('/patientDash');
                }
            } else {
                Alert.alert('Login Failed', data.error || 'Please try again');
            }
        } catch (error) {
            console.error('Login error:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };


    const onLogout = async () => {
        if (Platform.OS === 'web') {
            // For web, clear tokens from localStorage
            localStorage.removeItem('my-jwt');
            localStorage.removeItem('refreshToken');
        } else {
            // For mobile, clear tokens from SecureStore
            await SecureStore.deleteItemAsync('my-jwt');
            await SecureStore.deleteItemAsync('refreshToken');
        }

        setAuthState({ token: null, authenticated: false });
        router.push('/login');
    };


    const value = {
        authState,
        onRegister,
        onLogin,
        onLogout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
