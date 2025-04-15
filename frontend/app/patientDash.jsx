import { StyleSheet, View, Pressable, SafeAreaView, ScrollView, Button, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import NavBar from '@/components/navigation/NavBar';
import React, { useEffect, useState } from 'react';
import config from "../config";
import { Text } from 'react-native';



import { StatusBar } from 'expo-status-bar';

import { useAuth } from "./context/AuthContext";



const FeatureCard = ({ iconName, title, description, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [
    styles.card,
    pressed && styles.cardPressed
  ]}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={iconName} size={32} color="#87CFE9" />
    </View>
    <View style={styles.cardContent}>
      <ThemedText style={styles.cardTitle}>{title}</ThemedText>
      <ThemedText style={styles.cardDescription}>{description}</ThemedText>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color="#87CFE9" />
  </Pressable>
);

export default function HomeScreen() {
  const router = useRouter();

  const { authState } = useAuth();
  const { onLogout } = useAuth();
  const token = authState.token;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [provider, setProvider] = useState(null);
  const [recordingRequests, setRecordingRequests] = useState(null);
  const [sentRecordings, setSentRecordings] = useState([]);
  const [completedRecordings, setCompletedRecordings] = useState([]);


  const isTokenExpired = (token) => {
    if (!token || !isValidJWT(token)) {
      return true
    };  // Return true if token is invalid
    if (!token) return true;

    const { exp } = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;

    return exp < currentTime;
  }

  const isValidJWT = (token) => {
    if (typeof token !== 'string') return false;
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => /^[A-Za-z0-9\-_=]+$/.test(part));
  };


  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!token) {
        return;
      }
      if (isTokenExpired(token)) {
        return;
      }
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/patientManagement/profile/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch patient data');

        const patientData = await response.json();
        setPatient(patientData);
        console.log("Patient Data received: ", patientData);

        // After fetching the patient, fetch the associated surveys
        const surveysResponse = await fetch(`${config.BACKEND_URL}/api/surveyManagement/get_surveys_by_patient/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!surveysResponse.ok) throw new Error('Failed to fetch surveys data');

        const surveysData = await surveysResponse.json();
        setSurveys(surveysData);
        console.log("Surveys Data received: ", surveysData);

        const providerResponse = await fetch(`${config.BACKEND_URL}/api/providerManagement/get_provider_by_patient/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!providerResponse.ok) throw new Error('Failed to fetch provider data');

        const providerData = await providerResponse.json();
        setProvider(providerData.provider);
        console.log("Provider Data receieved: ", providerData);

      } catch (error) {
        console.error('Error fetching patient profile or surveys:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPatientProfile();
    } else {
      console.log("No token found");
    }
  }, [token]);

  const handleSurveyPress = (survey) => {
    router.push(
      {
        pathname: '/survey/surveyResponder',
        params:
        {
          survey: JSON.stringify(survey)
        }
      });
  };

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
  

  const sentSurveys = surveys.filter(survey => survey.status === 'sent');
  const completedSurveys = surveys.filter(survey => survey.status === 'completed');




  console.log("Provider State in JSX: ", provider);


  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>

        {loading ? (
          <ActivityIndicator size="large" color="#041575" style={{ marginTop: 40 }} />
        ) : (
          <>
            <ThemedText style={styles.title}>Welcome back,</ThemedText>
            <ThemedText style={styles.patientName}>{patient?.firstName}</ThemedText>
            <View style={styles.horizontalLine} />
          </>
        )}

        {/* Sent Surveys Section */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Surveys:</Text>
          {sentSurveys.length > 0 ? (
            sentSurveys.map((survey) => (
              <Pressable
                key={survey.id}
                style={styles.surveyButton}
                onPress={() => handleSurveyPress(survey)}
              >
                <View style={styles.surveyItem}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  <Text style={styles.surveyDate}>{new Date(survey.issue_date).toLocaleDateString()}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text>No pending surveys found for this patient.</Text>
          )}
        </View>

        {/* Completed Surveys Section */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Completed Surveys:</Text>
          {completedSurveys.length > 0 ? (
            completedSurveys.map((survey) => (
              <Pressable
                key={survey.id}
                style={styles.surveyButton}
                onPress={() => handleCompletedSurveyPress(survey)}
              >
                <View style={styles.surveyItem}>
                  <Text style={styles.surveyTitle}>{survey.title}</Text>
                  <Text style={styles.surveyDate}>{new Date(survey.issue_date).toLocaleDateString()}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text>No completed surveys found for this patient.</Text>
          )}

          <View>
            <Text>Pending Recordings:</Text>
          </View>

          {/* {recordingRequests && (
            <View style={styles.surveysContainer}>
              <Text style={styles.sectionTitle}>Pending Recordings:</Text>
              {recordingRequests.filter(rec => rec.status === 'sent').map((rec) => (
                <View key={rec.id} style={styles.surveyItem}>
                  <Text style={styles.surveyTitle}>{rec.title}</Text>
                  <Text style={styles.surveyDate}>{new Date(rec.issue_date).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          )} */}



          {provider && (
            <View>
              <Text>Provider:</Text>
              <Text>{provider.firstName}</Text>
            </View>
          )}


        </View>
        <FeatureCard
          iconName="microphone"
          title="Voice Recording"
          description="Record voice samples in a controlled environment for research purposes"
          onPress={() => router.push({
            pathname: '/recordings',
            params: {
              patient: JSON.stringify(patient)
            }
          })}
        />
        <Button title="profile" onPress={() => router.push(
          {
            pathname: '/profile',
            params: {
              patient: JSON.stringify(patient)
            }
          })}>profile</Button>


        <Button title="Log Out" onPress={onLogout} />
      </ScrollView>
    </SafeAreaView>
    /* <ThemedView style={styles.headerContainer}>
    <ThemedText type="title" style={styles.mainTitle}>
      AcoustiCare
    </ThemedText>
    <ThemedText style={styles.subtitle}>
      Contributing to voice health research through patient participation
    </ThemedText>
  </ThemedView>

  <ThemedView style={styles.featuresContainer}>
    <FeatureCard
      iconName="file-sign"
      title="Consent Management"
      description="Secure digital consent process for study participation"
      onPress={() => router.push('/consent')}
    />
    <FeatureCard
      iconName="file-document-outline"
      title="Patient Survey"
      description="Complete a comprehensive survey about your voice health history"
      onPress={() => router.push('/survey')}
    />
    
  </ThemedView>

  <View style={styles.infoContainer}>
    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="information" size={24} color="#60A5FA" />
        <ThemedText style={styles.sectionTitle}>About This Study</ThemedText>
      </View>
      <ThemedText style={styles.sectionText}>
        This application is designed to collect voice samples and relevant health information 
        from participants. Your contribution helps advance our understanding of voice-related 
        health conditions and potential treatments.
      </ThemedText>
    </View>

    <View style={styles.infoSection}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="play-circle" size={24} color="#60A5FA" />
        <ThemedText style={styles.sectionTitle}>Getting Started</ThemedText>
      </View>
      <ThemedText style={styles.sectionText}>
        Begin by reviewing and signing the consent form. Then complete the voice health survey 
        before proceeding to record your voice samples.
      </ThemedText>
    </View>
  </View>
   */

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
  },
  title: {
    fontSize: 27,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 20,
    color: '#041575',
    paddingTop: 20,
  },
  patientName: {
    fontSize: 30,
    fontFamily: 'Figtree_400Regular',
    color: '#041575',
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Figtree_400Regular',
    marginBottom: 10,
    color: '#041575',
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#87CFE9',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#475569',
    lineHeight: 24,
  },
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  card: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#87CFE9',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    gap: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cardPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#87CFE9',
  },
  cardDescription: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  infoContainer: {
    gap: 20,
  },
  infoSection: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
    shadowColor: '#93C5FD',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#87CFE9',
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
  },
});
