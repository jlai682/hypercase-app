import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from '../context/AuthContext';
import config from '../../config';
import BackButton from '../../components/BackButton';

const PreviousSurvey = () => {
    const [surveyData, setSurveyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { authState } = useAuth();
    const token = authState.token;

    const { survey } = useLocalSearchParams();
    const parsedSurvey = JSON.parse(survey || '[]');

    useEffect(() => {
        const fetchSurveyData = async () => {
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
                setSurveyData(data);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSurveyData();
    }, [survey]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>


                <View style={{ alignSelf: 'flex-start', marginTop: 50, marginLeft: 20 }}>
                    <BackButton />
                </View>



                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>

                <View style={{ alignSelf: 'flex-start', marginTop: 50, marginLeft: 20 }}>
                    <BackButton />
                </View>


                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        );
    }

    if (!surveyData) {
        return (
            <View style={styles.emptyContainer}>

                <View style={{ alignSelf: 'flex-start', marginTop: 50, marginLeft: 20 }}>
                    <BackButton />
                </View>


                <Text>No survey data available</Text>
            </View>
        );
    }

    console.log("SURVEY DATA: ", parsedSurvey);    // // Remove microseconds by truncating the date string to only include seconds
    const issueDateStr = parsedSurvey.issue_date.split('.')[0] + 'Z';  // Remove microseconds
    const responseDateStr = parsedSurvey.response_date.split('.')[0] + 'Z';  // Remove microseconds

    const issueDate = new Date(issueDateStr);
    const responseDate = new Date(responseDateStr);

    const formattedIssueDate = issueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + issueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
    const formattedResponseDate = responseDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + ' ' + responseDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });


    const renderItem = ({ item, index }) => (
        <View style={styles.itemContainer} key={index}>

            <Text style={styles.question}>{item.question.question_description}</Text>
            {item.options ? (
                <View style={styles.options}>
                    {item.options.map((option) => (
                        <View style={styles.optionContainer} key={option.id}>
                            <Text style={[
                                styles.optionText,
                                item.selected_option === option.option && styles.selectedOption
                            ]}>
                                {option.option}
                            </Text>
                        </View>
                    ))}
                </View>
            ) : (
                <Text style={styles.responseText}>
                    {item.response || 'No response provided'}
                </Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>

            <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10 }}>
                <BackButton />
            </View>


            <FlatList
                data={surveyData.multiple_choice_responses.concat(surveyData.open_responses)}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                ListHeaderComponent={
                    <>
                        <Text style={styles.surveyTitle}>{surveyData.survey_title}</Text>
                        <View style={styles.dateSection}>
                            <Text style={styles.dateText}>Issue Date: {formattedIssueDate}</Text>
                            <Text style={styles.dateText}>Response Date: {formattedResponseDate}</Text>
                        </View>
                    </>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#cae7ff',
        padding: 20, // Ensure there's space around the whole screen
    },
    surveyTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#00205B',
        marginBottom: 24,
        fontFamily: 'Figtree_400Regular',
        paddingHorizontal: 20,  // Add padding to prevent going to the edge
        paddingTop: 20,
    },
    dateSection: {
        marginBottom: 20,
        // padding: 20,  // Added padding to date section to avoid edge
    },
    dateText: {
        fontSize: 16,
        fontWeight: '400',
        color: '#555',
        marginBottom: 5,
        fontFamily: 'Figtree_400Regular',
        paddingHorizontal: 20,  // Added padding to date text
    },
    itemContainer: {
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginHorizontal: 10,  // Ensure item container doesn't touch edges
    },
    question: {
        fontSize: 18,
        fontWeight: '600',
        color: '#00205B',
        marginBottom: 12,
        fontFamily: 'Figtree_400Regular',
    },
    options: {
        flexDirection: 'column',
        gap: 12,
    },
    optionContainer: {
        backgroundColor: '#f4f4f4',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    optionText: {
        fontSize: 16,
        color: '#333333',
        fontFamily: 'Figtree_400Regular',
    },
    selectedOption: {
        fontWeight: 'bold',
        color: '#1e90ff',
    },
    responseText: {
        fontSize: 16,
        color: '#4a4a4a',
        fontFamily: 'Figtree_400Regular',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    errorText: {
        color: '#ff4d4f',
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});




export default PreviousSurvey;
