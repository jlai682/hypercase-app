import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    FlatList,
    Button,
} from 'react-native';
import { Audio } from 'expo-av';
import config from '../config'; // Update based on your structure
import { useAuth } from '../app/context/AuthContext';


const RecordingList = ({ recordings }) => {
    const [sound, setSound] = useState(null);

    const playSound = async (url) => {
        try {
            if (sound) {
                await sound.stopAsync();
                await sound.unloadAsync();
                setSound(null);
            }

            const { sound: newSound } = await Audio.Sound.createAsync({ uri: url });
            setSound(newSound);
            await newSound.playAsync();
        } catch (error) {
            console.error("Error playing sound", error);
        }
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>
            <Button title="Play" onPress={() => playSound(item.audio_file)} />
        </View>
    );

    return (
        <FlatList
            data={recordings}
            keyExtractor={(item, index) => (item?.id ? item.id.toString() : index.toString())}
            renderItem={renderItem}
        />
    );
};


const PreviousRecordings = () => {
    const [recordings, setRecordings] = useState([]);

    const { authState } = useAuth();
    const token = authState.token;

    console.log("RECORDINGS: ", recordings);


    // Check if JWT is expired
    const isTokenExpired = (token) => {
        if (!token || !isValidJWT(token)) {
            return true;
        }

        try {
            const { exp } = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return exp < currentTime;
        } catch (error) {
            console.error("Error parsing token:", error);
            return true;
        }
    };



    // Check if token has a valid JWT format
    const isValidJWT = (token) => {
        if (typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => /^[A-Za-z0-9\-_=]+$/.test(part));
    };



    useEffect(() => {
        const fetchData = async () => {

            if (!token || isTokenExpired(token)) return;

            try {
                const profileRes = await fetch(`${config.BACKEND_URL}/api/patientManagement/profile/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!profileRes.ok) throw new Error("Failed to get profile");

                const recordingRes = await fetch(`${config.BACKEND_URL}/api/recordings/by_patient/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!recordingRes.ok) throw new Error("Failed to get recordings");

                const data = await recordingRes.json();
                setRecordings(data);
            } catch (e) {
                console.error(e);
            }
        };

        fetchData();
    }, []);


    const playRecording = async (uri) => {
        try {
            // Stop currently playing recording if any
            if (currentlyPlaying) {
                await currentlyPlaying.sound.stopAsync();
                setCurrentlyPlaying(null);
            }

            if (Platform.OS === 'web') {
                // Web implementation
                let audioUrl = uri;

                // Create a new HTML5 Audio element
                const newSound = new Audio(audioUrl);

                // Create a wrapper object with compatible interface for our state
                const soundWrapper = {
                    stopAsync: () => {
                        newSound.pause();
                        newSound.currentTime = 0;
                        return Promise.resolve();
                    }
                };

                // Set up ended event
                newSound.onended = () => {
                    setCurrentlyPlaying(null);
                };

                // Start playing
                newSound.play();

                setCurrentlyPlaying({ uri, sound: soundWrapper });
            } else {
                // Native implementation using Expo AV
                const { sound: newSound } = await Audio.Sound.createAsync(
                    { uri },
                    { shouldPlay: true }
                );

                setCurrentlyPlaying({ uri, sound: newSound });

                newSound.setOnPlaybackStatusUpdate((status) => {
                    if (status.didJustFinish) {
                        setCurrentlyPlaying(null);
                    }
                });
            }
        } catch (err) {
            console.error('Failed to play recording:', err);
            Alert.alert('Error', 'Could not play recording');
        }
    };


    return (
        <View style={styles.container}>
            <Text style={styles.header}>Previous Recordings</Text>
            {recordings && recordings.length > 0 ? (
                <RecordingList recordings={recordings} />
            ) : (
                <Text>Loading...</Text>
            )}
            {recordings.length === 0 && (
                <Text>No Recordings yet</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});

export default PreviousRecordings;
