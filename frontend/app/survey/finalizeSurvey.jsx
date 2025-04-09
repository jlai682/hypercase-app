import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    Button,
} from 'react-native';import { useLocalSearchParams, useRouter } from 'expo-router';
import { TextInput } from 'react-native';
import { format } from 'date-fns'; // you'll need to install date-fns if not already
import config from '../../config';
import { useAuth } from '../context/AuthContext';



export default function FinalizeSurvey() {
    const { selectedMC, selectedOpen, patient } = useLocalSearchParams();
    const parsedPatient = patient ? JSON.parse(patient) : null;
    const parsedOpenQuestions = JSON.parse(selectedOpen || '[]');
    const parsedMCQuestions = JSON.parse(selectedMC || '[]');

    const { authState } = useAuth();
    const token = authState.token;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [surveyTitle, setSurveyTitle] = useState(() => {
        const today = format(new Date(), 'MMMM d, yyyy');
        return `${today} Survey`;
    });

    const router = useRouter();

    const handleCreateSurvey = async () => {
        console.log("patient: ", patient);
        console.log("patientId: ", parsedPatient.id);
        setLoading(true);
        try {
            // Prepare data to send
            const surveyData = {
                title: surveyTitle,
                patient_id: parsedPatient.id,
                open_question_ids: parsedOpenQuestions.map(q => q.id),
                mc_question_ids: parsedMCQuestions.map(q => q.id),
            };

            const response = await fetch(`${config.BACKEND_URL}/api/surveyManagement/create_survey/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Add token for authentication
                },
                body: JSON.stringify(surveyData),
            });

            const data = await response.json();

            if (response.ok) {
                // On success, navigate to success page
                // router.push('/survey/success');
                router.push({
                    pathname: '/patientProfile',
                    params: {patientEmail: parsedPatient.email}
                });
            } else {
                // Handle errors from backend
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            console.error('Survey creation error:', err);
            setError('Something went wrong');
        } finally {
            setLoading(false);
        }
    };


    return (
                <SafeAreaView style={{ flex: 1, backgroundColor: '#cae7ff' }}>
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.heading}>Finalize Your Survey</Text>

            <Text style={styles.label}>Survey Title:</Text>
            <TextInput
                style={styles.input}
                value={surveyTitle}
                onChangeText={setSurveyTitle}
            />


            <Text style={styles.heading}>Open-ended Questions</Text>
            {parsedOpenQuestions.map((q, index) => (
                <View key={`open-${q.id}`} style={styles.card}>
                    <Text style={styles.questionText}>{q.question_description}</Text>
                </View>
            ))}

            <Text style={styles.heading}>Multiple Choice Questions</Text>
            {parsedMCQuestions.map((q, index) => (
                <View key={`mc-${q.id}`} style={styles.card}>
                    <Text style={styles.questionText}>{q.question_description}</Text>
                    {q.options.map(opt => (
                        <Text key={opt.id} style={styles.optionText}>{opt.option}</Text>
                    ))}
                </View>
            ))}

            <Button title="Create Survey" onPress={handleCreateSurvey} />

            {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
                </SafeAreaView>
        
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#cae7ff',
    },
    heading: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 20,
        fontFamily: 'Figtree_400Regular',

    },
    card: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Figtree_400Regular',

    },
    optionText: {
        fontSize: 14,
        marginLeft: 10,
        color: '#333',
        fontFamily: 'Figtree_400Regular',

    },
    error: {
        color: 'red',
        marginTop: 20,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#041575',
        fontFamily: 'Figtree_400Regular',

    },

    input: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        fontFamily: 'Figtree_400Regular',

    },
});
