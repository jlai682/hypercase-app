import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';



const RecordButton = ({ isRecording, stopRecording, startRecording }) => {

    

    return (
        <View style={styles.recordButtonContainer}>
            <TouchableOpacity
                onPress={isRecording ? stopRecording : startRecording}
                style={[styles.recordButton, isRecording && styles.recordingActive]}
            >
                <Ionicons
                    name="mic"
                    size={75}
                    color={isRecording ? "#ff4444" : "#4A90E2"}
                />
            </TouchableOpacity>
            <Text style={styles.recordingStatus}>
                {isRecording ? "Recording..." : "Tap microphone to start recording"}
            </Text>
        </View>
    )

}


const styles = StyleSheet.create({
    recordButtonContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    recordButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#EDF2F7',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4A90E2',
        marginBottom: 16,
    },
    recordingActive: {
        borderColor: '#ff4444',
        backgroundColor: '#fff1f1',
    },
    recordingStatus: {
        color: '#666',
        fontSize: 17,
    },
})

export default RecordButton
