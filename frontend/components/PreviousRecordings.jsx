import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import config from '../config';
import { useAuth } from '../app/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const PreviousRecordings = () => {
    const [recordings, setRecordings] = useState([]);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    const { authState } = useAuth();
    const token = authState.token;

    const isTokenExpired = (token) => {
        if (!token || !isValidJWT(token)) return true;
        try {
            const { exp } = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return exp < currentTime;
        } catch (error) {
            console.error("Error parsing token:", error);
            return true;
        }
    };

    const isValidJWT = (token) => {
        if (typeof token !== 'string') return false;
        const parts = token.split('.');
        return parts.length === 3 && parts.every(part => /^[A-Za-z0-9\-_=]+$/.test(part));
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!token || isTokenExpired(token)) return;
            try {
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
            if (currentlyPlaying) {
                await currentlyPlaying.sound.stopAsync();
                setCurrentlyPlaying(null);
            }

            if (Platform.OS === 'web') {
                const audio = new window.Audio(uri);
                const soundWrapper = {
                    stopAsync: () => {
                        audio.pause();
                        audio.currentTime = 0;
                        return Promise.resolve();
                    },
                };
                audio.onended = () => setCurrentlyPlaying(null);
                audio.play();
                setCurrentlyPlaying({ uri, sound: soundWrapper });
            } else {
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

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
            </View>
            <TouchableOpacity style={styles.playIconButton} onPress={() => playRecording(item.audio_file)}>
                <Ionicons name="play-circle" size={46} color="#041575" />
            </TouchableOpacity>
        </View>
    );

    return (
        <FlatList
            contentContainerStyle={styles.container}
            data={recordings}
            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
            ListHeaderComponent={<Text style={styles.header}>Previous Recordings</Text>}
            ListEmptyComponent={<Text style={styles.emptyText}>No Recordings yet</Text>}
            renderItem={renderItem}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
        color: '#041575',
    },
    playIconButton: {
        marginTop: 16,
        alignSelf: 'flex-start',
    },
    card: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingTop: 5,
        paddingBottom: 5,
        paddingLeft: 15,
        paddingRight: 15,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    textContainer: {
        flex: 1,
        paddingRight: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
        color: '#041575',
    },
    description: {
        fontSize: 12,
        color: '#4B5563',
        marginTop: 6,
        lineHeight: 15,
    },
    button: {
        marginTop: 20,
        backgroundColor: '#041575',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 15,
        fontStyle: 'italic',
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 20,
    },
});

export default PreviousRecordings;
