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
  

interface AuthProps {
    authState: { token: string | null; authenticated: boolean | null };
    onRegister: (email: string, password: string, firstName: string, lastName: string, signupType: string, age?: string) => Promise<any>;
    onLogin: (email: string, password: string, loginType: string) => Promise<any>;
    onLogout: () => Promise<any>;
}

const storeToken = async (token: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  };

const loadToken = async () => {
    if (Platform.OS === 'web') {
      // Retrieve token from localStorage for web
      return localStorage.getItem(TOKEN_KEY);
    } else {
      // Retrieve token from SecureStore for mobile
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
};

const AuthContext = createContext<AuthProps | undefined>(undefined);

const TOKEN_KEY = 'my-jwt';

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
          const storedToken = await loadToken();  // Use loadToken to get the token
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
  

    const onRegister = async (email: string, password: string, firstName: string, lastName: string, signupType: string, age?: string,) => {

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
                await storeToken(data.access);
                setAuthState({ token: data.access, authenticated: true });
                if (signupType === "provider") {
                    router.push("/providerDash")
                }
                else{
                    router.push("/home")
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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("Received data:", data);  // Debugging the response


            if (response.ok) {
                // Store access and refresh tokens

                await storeToken(data.access);
                //await SecureStore.setItemAsync('refreshToken', data.refresh);  // Always keep this in SecureStore



                // Navigate based on the login type
                if (loginType === 'provider') {
                    console.log("push to provider dash");
                    router.push('/providerDash');
                } else {
                    router.push('/home');
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
        await SecureStore.deleteItemAsync(TOKEN_KEY);
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
