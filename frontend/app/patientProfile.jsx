import React, { useEffect, useState } from 'react';
import config from '../config';
import { useAuth } from "./context/AuthContext";
import { SafeAreaView } from 'react-native';
import { StyleSheet, View, Pressable, Text, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { Image } from 'react-native';
import profile from '../assets/images/profile.png';
import { useRouter, useLocalSearchParams } from "expo-router";

export default function PatientProfile() {
  const { patientEmail } = useLocalSearchParams();
  const [patient, setPatient] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [recordingRequests, setRecordingRequests] = useState([]); // State for recording requests
  const [error, setError] = useState(null);
  
  // For the request modal
  const [modalVisible, setModalVisible] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');

  const router = useRouter();

  // Access the token from AuthContext
  const { authState } = useAuth();
  const token = authState.token;

  useEffect(() => {
    const fetchPatient = async () => {
      if (!token || !patientEmail) return;

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

  // Fetch recording requests for this patient
  useEffect(() => {
    const fetchRecordingRequests = async () => {
      if (patient) {
        try {
          const response = await fetch(`${config.BACKEND_URL}/api/recordings/recording-requests/by-patient/${patient.id}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();
          if (response.ok) {
            setRecordingRequests(data);  // Set the recording requests data
          } else {
            console.error('Error fetching recording requests:', data.error);
          }
        } catch (error) {
          console.error('Request failed:', error);
        }
      }
    };

    fetchRecordingRequests();
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

  const submitRecordingRequest = async () => {
    if (!requestTitle.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/recordings/recording-requests/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: patient.id,
          title: requestTitle,
          description: "Please record your voice and submit it."
        }),
      });
      
      const data = await response.json();
      if (response.ok) {
        Alert.alert("Success", "Recording request sent successfully!");
        // Refresh the recording requests
        fetchRecordingRequests();
        // Reset form and close modal
        setRequestTitle('');
        setModalVisible(false);
      } else {
        Alert.alert("Error", data.error || "Failed to send recording request");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while sending the recording request");
    }
  };

  // Separate surveys into pending and completed
  const pendingSurveys = surveys.filter(survey => survey.status === 'sent');
  const completedSurveys = surveys.filter(survey => survey.status === 'completed');
  
  // Separate recording requests into pending and completed
  const pendingRecordings = recordingRequests.filter(req => req.status === 'sent');
  const completedRecordings = recordingRequests.filter(req => req.status === 'completed');

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

  const handleRecordingRequestPress = (request) => {
    // Navigate to recording details page or play the recording if completed
    if (request.status === 'completed' && request.recording_id) {
      router.push({
        pathname: '/recordings/view',
        params: {
          recordingId: request.recording_id
        }
      });
    } else {
      // Could navigate to a page where the patient can fulfill the recording request
      router.push({
        pathname: '/recordings/fulfill-request',
        params: {
          requestId: request.id
        }
      });
    }
  }

  const fetchRecordingRequests = async () => {
    if (patient) {
      try {
        const response = await fetch(`${config.BACKEND_URL}/api/recordings/recording-requests/by-patient/${patient.id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (response.ok) {
          setRecordingRequests(data);
        } else {
          console.error('Error fetching recording requests:', data.error);
        }
      } catch (error) {
        console.error('Request failed:', error);
      }
    }
  };

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

        {/* Display Pending Recording Requests */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Recordings:</Text>
          {pendingRecordings.length > 0 ? (
            pendingRecordings.map((request) => (
              <Pressable 
                key={request.id} 
                style={styles.surveyItem} 
                onPress={() => handleRecordingRequestPress(request)}
              >
                <Text style={styles.surveyTitle}>{request.title}</Text>
                <Text style={styles.surveyDate}>{new Date(request.issue_date).toLocaleDateString()}</Text>
              </Pressable>
            ))
          ) : (
            <Text>No pending recordings.</Text>
          )}
        </View>

        {/* Display Completed Recording Requests */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Completed Recordings:</Text>
          {completedRecordings.length > 0 ? (
            completedRecordings.map((request) => (
              <Pressable
                key={request.id}
                style={styles.surveyItem}
                onPress={() => handleRecordingRequestPress(request)}
              >
                <Text style={styles.surveyTitle}>{request.title}</Text>
                <Text style={styles.surveyDate}>
                  {new Date(request.issue_date).toLocaleDateString()}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text>No completed recordings found.</Text>
          )}
        </View>

        {/* Button to create a new survey */}
        <Pressable style={styles.surveyButton} onPress={createSurvey}>
          <Text style={styles.surveyButtonText}>Send a New Survey</Text>
        </Pressable>

        {/* Button to create a new recording request */}
        <Pressable style={[styles.surveyButton, styles.recordingButton]} onPress={() => setModalVisible(true)}>
          <Text style={styles.surveyButtonText}>Send a New Recording Request</Text>
        </Pressable>
        
        {/* Modal for entering recording request title */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>New Recording Request</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter recording title"
                value={requestTitle}
                onChangeText={setRequestTitle}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.textStyle}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.buttonSubmit]}
                  onPress={submitRecordingRequest}
                >
                  <Text style={styles.textStyle}>Submit</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    elevation: 3,
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
  recordingButton: {
    backgroundColor: '#1565C0',
    marginTop: 15,
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
    marginBottom: 10,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#041575',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#888',
  },
  buttonSubmit: {
    backgroundColor: '#041575',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});