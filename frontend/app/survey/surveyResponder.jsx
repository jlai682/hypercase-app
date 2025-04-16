import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from '../context/AuthContext';
import config from '../../config';
import { ThemedText } from '@/components/ThemedText';
import { TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../../components/BackButton';




const SurveyResponder = () => {
    const [surveyData, setSurveyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [openResponses, setOpenResponses] = useState({});
    const [multipleChoiceResponses, setMultipleChoiceResponses] = useState({});


    const router = useRouter();

    const { authState } = useAuth();
    const token = authState.token;

    const { survey } = useLocalSearchParams();
    const parsedSurvey = JSON.parse(survey || '[]');

    useEffect(() => {
        // Fetch survey responses from the API
        const fetchSurveyData = async () => {
            console.log("Using token:", token);
            if (!token) {
                setError("No token found.");
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${config.BACKEND_URL}/api/surveyManagement/survey_questions/${parsedSurvey.id}/`, {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    }
                });
                if (!response.ok) {
                    throw new Error('Survey not found');
                }
                const data = await response.json();
                console.log("data: ", data)
                setSurveyData(data);

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSurveyData();

    }, [survey]);

    const RadioButton = ({ selected, onSelect, label }) => (
        <Pressable
            onPress={onSelect}
            style={({ pressed }) => [
                styles.radioOption,
                pressed && styles.radioOptionPressed
            ]}
        >
            <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioInner} />}
            </View>
            <ThemedText style={[
                styles.radioLabel,
                selected && styles.radioLabelSelected
            ]}>{label}</ThemedText>
        </Pressable>
    );

    useEffect(() => {
        // Update multipleChoiceResponses when selectedOptions changes
        const tempResponses = [];

        if (surveyData && surveyData.multiple_choice_responses) {
            // Handle multiple choice responses
            surveyData.multiple_choice_responses.forEach((questionObj, index) => {
                tempResponses.push({
                    questionObject: questionObj,
                    response: selectedOptions[index] || null,
                });
            });

            // Update the multiple choice responses in the state
            setMultipleChoiceResponses(tempResponses);

            // Log the updated responses (for debugging)
            console.log("Updated multiple choice responses:", tempResponses);
        }

    }, [selectedOptions, surveyData]); // Add surveyData as a dependency to trigger when it changes


    const submitSurvey = async () => {
        console.log("open responses: ", openResponses);
        console.log("multiple choice responses: ", multipleChoiceResponses);

        try {
            // Construct the data to be sent to the backend
            const data = {
                multiple_choice_responses: multipleChoiceResponses,
                open_responses: openResponses
            };

            // Make the API call to submit the survey responses
            const response = await fetch(`${config.BACKEND_URL}/api/surveyManagement/submit/${parsedSurvey.id}/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data), // Send the constructed data
            });

            // Handle response
            if (!response.ok) {
                throw new Error('Error submitting survey');
            }

            const result = await response.json();
            console.log("Survey submitted successfully:", result);
            // You can navigate or show a success message here if needed

        } catch (error) {
            console.error("Error submitting survey:", error);
            // Handle error (e.g., show a message to the user)
        }

        router.push('/patientDash')

    };


    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    if (!surveyData) {
        return (
            <View style={styles.emptyContainer}>
                <Text>No survey data available</Text>
            </View>
        );
    }

    const onSelect = (index, option) => {
        // Set the selected option for the specific question (index)
        setSelectedOptions((prev) => {
            const updated = { ...prev, [index]: option }; // Store the selected option for the question
            console.log("Updated selected options: ", updated); // Logging updated state
            return updated;
        });
    }



    const handleOpenResponseChange = (index, text) => {
        setOpenResponses((prev) => ({
            ...prev,
            [index]: { questionObject: surveyData.open_responses[index], response: text }
        }));
    }

    return (
        <SafeAreaView style={styles.safeArea}>

            <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
                <BackButton />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.container}>
                    <Text style={styles.surveyTitle}>{surveyData.survey_title}</Text>

                    <View style={styles.section}>
                        {surveyData.multiple_choice_responses.length > 0 ? (
                            <FlatList
                                scrollEnabled={false}
                                data={surveyData.multiple_choice_responses}
                                renderItem={({ item, index }) => (
                                    <View style={styles.itemContainer}>
                                        <Text style={styles.question}>{item.question.question_description}</Text>
                                        <View style={styles.options}>
                                            {item.options.map((option) => (
                                                <RadioButton
                                                    key={option.id}
                                                    label={option.option}
                                                    selected={selectedOptions[index]?.id === option.id}
                                                    onSelect={() => onSelect(index, option)}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                )}
                                keyExtractor={(item, index) => index.toString()}
                            />
                        ) : (
                            <Text>No multiple choice responses</Text>
                        )}
                    </View>

                    <View style={styles.section}>
                        {surveyData.open_responses.length > 0 ? (
                            <FlatList
                                scrollEnabled={false}
                                data={surveyData.open_responses}
                                renderItem={({ item, index }) => (
                                    <View style={styles.itemContainer}>
                                        <Text style={styles.question}>{item.question.question_description}</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            multiline
                                            placeholder="Type your response here..."
                                            value={openResponses[index]?.response || ''}
                                            onChangeText={(text) => handleOpenResponseChange(index, text)}
                                        />
                                    </View>
                                )}
                                keyExtractor={(item, index) => index.toString()}
                            />
                        ) : (
                            <Text>No open question responses</Text>
                        )}
                    </View>

                    <Pressable style={styles.submitButton} onPress={submitSurvey}>
                        <Text style={styles.submitButtonText}>Submit</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>


    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#cae7ff',
    },
    scrollContainer: {
        padding: 15,
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#cae7ff',
    },
    surveyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        fontFamily: 'Figtree_400Regular',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    itemContainer: {
        marginBottom: 10,
    },
    optionsContainer: {
        marginLeft: 10,
        marginTop: 5,
    },
    optionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 5,
    },
    optionText: {
        fontSize: 14,
        color: '#333',
    },
    selectedOption: {
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 5,
    },
    responseText: {
        fontSize: 14,
        color: '#333',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    question: {
        fontSize: 17,
        fontWeight: '600',
        color: '#00205B',
        lineHeight: 24,
        marginBottom: 4,
        fontFamily: 'Figtree_400Regular',
    },
    options: {
        gap: 16,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#F8FAFF',
        fontFamily: 'Figtree_400Regular',

    },
    radioOptionPressed: {
        backgroundColor: '#E6F0FF',
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#00205B',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Figtree_400Regular',

    },
    radioSelected: {
        borderColor: '#00205B',
    },
    radioSelected: {
        borderColor: '#00205B',  // Border color when selected
        backgroundColor: '#E6F0FF',  // Optional background color when selected
    },

    radioInner: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00205B',  // Inner circle color
    },
    radioLabelSelected: {
        color: '#00205B',
        fontWeight: '500',
    },
    textInput: {
        height: 100,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        backgroundColor: '#fff',
        marginTop: 8,
        textAlignVertical: 'top',
        fontFamily: 'Figtree_400Regular',

    },
    submitButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 20,
        backgroundColor: '#00205B',  // Deep blue background
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 6,
        elevation: 5,  // Adds depth on Android
    },
    submitButtonText: {
        fontSize: 18,
        color: '#fff',  // White text color
        fontWeight: '600',
        fontFamily: 'Figtree_400Regular',
    },

});

export default SurveyResponder;
