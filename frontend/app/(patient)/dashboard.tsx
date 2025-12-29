import { StyleSheet, View, Pressable, ScrollView, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';

import config from "@/config";
import { useAuth } from "@/components/auth/AuthContext";
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import { Patient, Provider, Survey } from '@/types';

function HomeScreen() {
  const { authState, onLogout } = useAuth();
  const token = authState.token;

  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  

  useEffect(() => {
    const fetchPatientProfile = async (): Promise<void> => {
      if (!token) {
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

        console.log("GOT REQUEST")
        
        console.log(response)

        // If 403, this user is not a patient (likely a provider), silently skip
        if (response.status === 403) {
          setLoading(false);
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch patient data');

        const patientData: Patient = await response.json();
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

        const surveysData: Survey[] = await surveysResponse.json();
        setSurveys(surveysData);
        console.log("Surveys Data received: ", surveysData);

        const providerResponse = await fetch(`${config.BACKEND_URL}/api/providerManagement/get_provider_by_patient/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!providerResponse.ok) throw new Error('Failed to fetch provider data');

        const providerData: { provider: Provider } = await providerResponse.json();
        setProvider(providerData.provider);
        console.log("Provider Data received: ", providerData);

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

  const handleSurveyPress = (survey: Survey): void => {
      router.push(`/(patient)/surveys/respond/${survey.id}` as any);
  
    };

  const sentSurveys: Survey[] = surveys.filter((survey: Survey) => survey.status === 'sent');

  console.log("Provider State in JSX: ", provider);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>

        {loading ? (
          <ActivityIndicator size="large" color="#041575" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.title}>Welcome back, {patient?.firstName}</Text>

            <View style={styles.horizontalLine} />
          </>
        )}

        {provider && (
          <View style={styles.providerCard}>
            <Text style={styles.sectionTitle}>Your Provider:</Text>
            <Text style={styles.providerName}>Dr. {provider.lastName}</Text>
          </View>
        )}

        {/* Pending Surveys Section */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Surveys:</Text>
          {sentSurveys.length > 0 ? (
            sentSurveys.map((survey: Survey) => (
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
            <Text style={styles.surveyDate}>No pending surveys found for this patient.</Text>
          )}
        </View>
        
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
    boxShadow: '0px 2px 5px 0px rgba(0, 0, 0, 0.05)',
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
    boxShadow: '0px 1px 3px 0px rgba(0, 0, 0, 0.05)',
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
    boxShadow: '0px 2px 5px 0px rgba(0, 0, 0, 0.05)',
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

export default function HomeScreenWrapper(): React.JSX.Element {
  return (
    <ProtectedRoute>
      <HomeScreen />
    </ProtectedRoute>
  );
}