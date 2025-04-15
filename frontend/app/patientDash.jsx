import { StyleSheet, View, Pressable, SafeAreaView, ScrollView, Button, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import React, { useEffect, useState } from 'react';
import config from "../config";
import { Text } from 'react-native';




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

        {provider && (

          <View style={styles.providerCard}>
            <Text style={styles.sectionTitle}>Your Provider:</Text>
            <Text style={styles.providerName}>Dr. {provider.lastName}</Text>
          </View>)}

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
            <Text style = {styles.surveyDate}>No pending surveys found for this patient.</Text>
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



        </View>
        <FeatureCard
          iconName="microphone"
          title="Recordings"
          onPress={() => router.push({
            pathname: '/recordings',
            params: {
              patient: JSON.stringify(patient)
            }
          })}
        />
        <Pressable style={styles.button} onPress={() => router.push({
          pathname: '/profile',
          params: { patient: JSON.stringify(patient) }
        })}>
          <Text style={styles.buttonText}>Profile</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={onLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#041575',
    marginTop: 10,
    fontFamily: 'Figtree_400Regular',
  },
  patientName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#041575',
    marginBottom: 10,
    fontFamily: 'Figtree_400Bold',
  },
  horizontalLine: {
    height: 2,
    backgroundColor: '#87CFE9',
    marginVertical: 15,
    borderRadius: 5,
  },
  surveysContainer: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 10,
    fontFamily: 'Figtree_400Bold',
  },
  surveyButton: {
    backgroundColor: '#e8f4ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  surveyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#041575',
    fontFamily: 'Figtree_400Regular',
  },
  surveyDate: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Figtree_400Regular',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: '#f0f8ff',
  },
  iconContainer: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#041575',
    fontFamily: 'Figtree_400Bold',
  },
  cardDescription: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Figtree_400Regular',
  },
  providerCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#041575',
    marginBottom: 4,
    fontFamily: 'Figtree_400Regular',
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
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Figtree_400Regular',
  },


});
