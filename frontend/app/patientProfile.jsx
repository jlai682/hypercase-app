import React, { useEffect, useState } from 'react';
import config from '../config';
import { useAuth } from "./context/AuthContext";
import { SafeAreaView } from 'react-native';
import { StyleSheet, Platform, View, Pressable, FlatList, TouchableOpacity, Text, Alert, ScrollView, Modal, TextInput } from 'react-native';
import { Image } from 'react-native';
import profile from '../assets/images/profile.png';
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import BackButton from '@/components/BackButton'; // Import the BackButton component
import { Audio } from 'expo-av';



export default function PatientProfile() {
  const { patientEmail } = useLocalSearchParams();
  const [patient, setPatient] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [recordingRequests, setRecordingRequests] = useState([]); // State for recording requests
  const [error, setError] = useState(null);
  const [previousRecordings, setPreviousRecordings] = useState([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);


  // For the request modal
  const [modalVisible, setModalVisible] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');

  const router = useRouter();

  // Access the token from AuthContext
  const { authState } = useAuth();
  const token = authState.token;

  const playRecording = async (uri) => {
    try {
      console.log("🔊 Attempting to play URI:", uri);

      // Stop currently playing recording if any
      if (currentlyPlaying) {
        console.log("⏹️ Stopping currently playing audio");
        await currentlyPlaying.sound.stopAsync();
        await currentlyPlaying.sound.unloadAsync();  // 🔥 This is key
        setCurrentlyPlaying(null);
      }

      if (Platform.OS === 'web') {
        // Web implementation
        const newSound = new window.Audio(uri);
        console.log("🎧 Created Audio element:", newSound);

        // Check if browser supports the type
        const canPlayMp3 = newSound.canPlayType('audio/mpeg');
        const canPlayWav = newSound.canPlayType('audio/wav');
        console.log(`🧪 canPlayType('audio/mpeg'): ${canPlayMp3}`);
        console.log(`🧪 canPlayType('audio/wav'): ${canPlayWav}`);

        newSound.onerror = (e) => {
          console.error("❌ Audio load/play error:", e);
        };

        // Create a wrapper object with compatible interface for our state
        const soundWrapper = {
          stopAsync: () => {
            newSound.pause();
            newSound.currentTime = 0;
            return Promise.resolve();
          }
        };

        newSound.onended = () => {
          console.log("✅ Finished playing audio");
          setCurrentlyPlaying(null);
        };

        const playPromise = newSound.play();

        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error("❌ Failed to play audio:", err);
          });
        }

        setCurrentlyPlaying({ uri, sound: soundWrapper });
      } else {
        // Native (mobile) implementation using Expo AV
        if (currentlyPlaying) {
          console.log("⏹️ Stopping and unloading current sound");
          await currentlyPlaying.sound.stopAsync();
          await currentlyPlaying.sound.unloadAsync(); // unload to reset
          setCurrentlyPlaying(null);
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );

        console.log("📱 Playing sound natively");
        setCurrentlyPlaying({ uri, sound: newSound });

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            console.log("✅ Native audio finished");
            setCurrentlyPlaying(null);
          }
        });
      }
    } catch (err) {
      console.error('🚨 Failed to play recording:', err);
      Alert.alert('Error', 'Could not play recording');
    }
  };



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
      if (patient && token) {
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

  const fetchPreviousRecordings = async () => {
    if (!patient || !token) {
      return
    }
    try {
      const response = await fetch(`${config.BACKEND_URL}/api/recordings/provider-patient-recordings/?patient_id=${patient.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,  // or use 'Cookie': 'sessionid=...' if you're using session authentication
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recordings');
      }

      const data = await response.json();
      console.log('Recordings:', data);
      setPreviousRecordings(data);
    } catch (error) {
      console.error('Error fetching recordings:', error.message);
      throw error;
    }
  };


  // Fetch recording requests for this patient
  useEffect(() => {
    const fetchRecordingRequests = async () => {
      if (patient && token) {
        try {
          const response = await fetch(`${config.BACKEND_URL}/api/recordings/recording-requests/patient/${patient.id}/`, {
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
    fetchPreviousRecordings();
  }, [patient, token]);



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
        const response = await fetch(`${config.BACKEND_URL}/api/recordings/recording-requests/patient/${patient.id}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        const data = await response.json();
        if (response.ok) {
          console.log('🔍 ALL RECORDING REQUESTS:', data); // Debug log
          console.log('🔍 FIRST REQUEST DETAILS:', data[0]); // Debug log
          setRecordingRequests(data);
        } else {
          console.error('Error fetching recording requests:', data.error);
        }
      } catch (error) {
        console.error('Request failed:', error);
      }
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
  )

    // Define a function for rendering the list of surveys and recording requests
  const renderSurveySection = (title, data, onPress) => (
    <View style={styles.surveysContainer}>
      <Text style={styles.sectionTitle}>{title}:</Text>
      {data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable style={styles.surveyItem} onPress={() => onPress(item)}>
              <Text style={styles.surveyTitle}>{item.title}</Text>
              <Text style={styles.surveyDate}>{new Date(item.issue_date).toLocaleDateString()}</Text>
            </Pressable>
          )}
        />
      ) : (
        <Text>No {title.toLowerCase()} found.</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={{ alignSelf: 'flex-start', marginTop: 10, marginLeft: 10, marginBottom: 10 }}>
          <BackButton />
        </View>
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
            <FlatList
              data={pendingSurveys}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.surveyItem}
                  onPress={() => console.log(`Survey clicked: ${item.title}`)}
                >
                  <Text style={styles.surveyTitle}>{item.title}</Text>
                  <Text style={styles.surveyDate}>{new Date(item.issue_date).toLocaleDateString()}</Text>
                </Pressable>
              )}
            />
          ) : (
            <Text>No pending surveys.</Text>
          )}
        </View>

        {/* Display Completed Surveys */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Completed Surveys:</Text>
          {completedSurveys.length > 0 ? (
            <FlatList
              data={completedSurveys}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.surveyItem}
                  onPress={() => handleCompletedSurveyPress(item)}
                >
                  <Text style={styles.surveyTitle}>{item.title}</Text>
                  <Text style={styles.surveyDate}>
                    {new Date(item.issue_date).toLocaleDateString()}
                  </Text>
                </Pressable>
              )}
            />
          ) : (
            <Text>No completed surveys found.</Text>
          )}
        </View>

        {/* Display Pending Recording Requests */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Pending Recordings:</Text>
          {pendingRecordings.length > 0 ? (
            <FlatList
              data={pendingRecordings}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.surveyItem}
                  onPress={() => handleRecordingRequestPress(item)}
                >
                  <Text style={styles.surveyTitle}>{item.title}</Text>
                  <Text style={styles.surveyDate}>{new Date(item.issue_date).toLocaleDateString()}</Text>
                </Pressable>
              )}
            />
          ) : (
            <Text>No pending recordings.</Text>
          )}
        </View>

        {/* Display Completed Recording Requests */}
        <View style={styles.surveysContainer}>
          <Text style={styles.sectionTitle}>Previous Recordings:</Text>

          <FlatList
            contentContainerStyle={styles.container}
            data={previousRecordings}
            keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
            ListEmptyComponent={<Text style={styles.emptyText}>No Recordings yet</Text>}
            renderItem={renderItem}
          />
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
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 20,
  },
});