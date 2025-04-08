import React, { useEffect, useState } from 'react';
import config from '../config';
import { useAuth } from "./context/AuthContext";
import { SafeAreaView } from 'react-native';
import { StyleSheet, View, Pressable, Text, Alert, ScrollView } from 'react-native';
import { Image } from 'react-native';
import profile from '../assets/images/profile.png';
import { useRouter, useLocalSearchParams } from "expo-router";

export default function PatientProfile() {
  const { patientEmail } = useLocalSearchParams();
  const [patient, setPatient] = useState(null);
  const [surveys, setSurveys] = useState([]);  // State to hold the surveys
  const [error, setError] = useState(null);

  const router = useRouter();

  // Access the token from AuthContext
  const { authState } = useAuth();
  const token = authState.token;

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/providerManagement/search_patient/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ email: patientEmail }),
        });

        const data = await response.json();
        if (response.ok) {
          setPatient(data.patient);
          console.log("PATIENT DATA:", data.patient);
        } else {
          setError(data.error || 'Patient not found');
        }
      } catch (error) {
        setError('An error occurred while fetching patient data');
      }
    };

    if (patientEmail) {
      fetchPatient();
    } else {
      console.log("No patient email provided");
    }
  }, [patientEmail, token]);

  // Fetch all surveys associated with the patient when the component mounts
  useEffect(() => {
    const fetchSurveys = async () => {
      if (patient) {
        try {
          const response = await fetch(`${config.BACKEND_URL}/api/surveyManagement/get_surveys/${patient.id}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();
          if (response.ok) {
            setSurveys(data);  // Set the surveys data
          } else {
            console.error('Error fetching surveys:', data.error);
            setError(data.error || 'Failed to fetch surveys');
          }
        } catch (error) {
          console.error('Request failed:', error);
          setError('Something went wrong while fetching surveys.');
        }
      }
    };

    fetchSurveys();
  }, [patient, token]); // Runs when patient data is fetched

  if (error) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  const createSurvey = async () => {
    router.push({
      pathname: '/survey/selectQuestions',
      params: {
        patient: JSON.stringify(patient)
      }
    });
  };

  // Separate surveys into pending and completed
  const pendingSurveys = surveys.filter(survey => survey.status === 'sent');
  const completedSurveys = surveys.filter(survey => survey.status === 'completed');

  const handleCompletedSurveyPress = (survey) => {
    router.push(
      {
        pathname: '/survey/previousSurvey',
        params:
        {
          survey: JSON.stringify(survey)
        }
      }
    )
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image source={profile} style={styles.profileImage} />
          {patient ? (
            <Text style={styles.patientName}>{patient.firstName} {patient.lastName}</Text>
          ) : (
            <Text>Loading...</Text>
          )}
        </View>

        {/* Display Pending Surveys */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Surveys:</Text>
          {pendingSurveys.length > 0 ? (
            pendingSurveys.map((survey) => (
              <Pressable key={survey.id} style={styles.surveyItem} onPress={() => console.log(`Survey clicked: ${survey.title}`)}>
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                <Text style={styles.surveyDate}>{new Date(survey.issue_date).toLocaleDateString()}</Text>
              </Pressable>
            ))
          ) : (
            <Text>No pending surveys.</Text>
          )}
        </View>

        {/* Display Completed Surveys */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Completed Surveys:</Text>
          {completedSurveys.length > 0 ? (
            completedSurveys.map((survey) => (
              <Pressable
                key={survey.id}
                style={styles.surveyItem}
                onPress={() => handleCompletedSurveyPress(survey)}
              >
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                <Text style={styles.surveyDate}>
                  {new Date(survey.issue_date).toLocaleDateString()}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text>No completed surveys found.</Text>
          )}

        </View>

        {/* Button to create a new survey */}
        <Pressable style={styles.surveyButton} onPress={createSurvey}>
          <Text style={styles.surveyButtonText}>Send a New Survey</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#cae7ff',
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    width: '100%',
    padding: 20,
    fontFamily: 'Figtree_400Regular',
  },
  profileImage: {
    width: 75,
    height: 75,
    borderRadius: 75,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  patientName: {
    fontSize: 35,
    fontFamily: 'Figtree_400Regular',
    color: '#041575',
    paddingRight: 10,
  },
  surveysContainer: {
    marginTop: 20,
  },
  surveyItem: {
    marginBottom: 15,
    backgroundColor: 'white', // Light background for survey items
    borderRadius: 10,
    padding: 15,
    elevation: 3, // Shadow for better visual appeal
  },
  surveyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#041575',
  },
  surveyDate: {
    marginTop: 5,
    color: '#666',
  },
  surveyButton: {
    marginTop: 20,
    backgroundColor: '#041575',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  surveyButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#041575',
  },
});
