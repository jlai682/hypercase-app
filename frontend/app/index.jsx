import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Figtree_400Regular, Figtree_700Bold } from '@expo-google-fonts/figtree';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

export default function Landing() {
  const router = useRouter();

  // Load fonts
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_700Bold,
  });

  // Ensure splash screen doesn't hide until fonts are loaded
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Prevent rendering until fonts are loaded
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <Text style={styles.title}>AcoustiCare</Text>

      <Image source={require('../assets/images/Soundwave.png')} style={styles.logo} />




      <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/login', params: { loginType: "patient" }})}>
        <Text style={styles.buttonText}>Patient Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.push({pathname: '/login', params: { loginType: "provider" }})}>
        <Text style={styles.buttonText}>Provider Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#cae7ff',
  },
  title: {
    fontSize: 35,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 20,
    color: '#041575',
  },
  button: {
    width: 200,
    height: 50,
    backgroundColor: '#041575',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 10, // Adds spacing between buttons
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Figtree_400Regular',
  },
  logo: {
    width: 250,  // Adjust size as needed
    height: 200, 
    marginBottom: 20,
  },
});
