import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { useAuth } from "@/components/auth/AuthContext";
import { useRouter, useLocalSearchParams } from 'expo-router';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Patient, ConsentResponse } from '@/types';

import { showAlert } from '@/components/utils/alerts';

// Define API URL at the top level
import config from '@/config';
const API_URL = `${config.BACKEND_URL}/api`;

// Define color palette - more subdued and official
const COLORS = {
  babyBlue: '#E6F3FF',
  babyBlueDark: '#4A90E2',
  white: '#FFFFFF',
  text: '#2C3E50',
  lightText: '#5A6B7F',
  border: '#D9E6F2',
  disabled: '#F0F4F8',
  disabledText: '#A0AEC0',
  divider: '#EDF2F7',
  sectionBg: '#F8FBFF',
} as const;

interface SignatureData {
  patient_id: string | number;
  is_checked: boolean;
  digital_signature: string;
  date: string;
}

interface ConsentFormProps {
  onSubmit?: (data: ConsentResponse) => void;
  signupType?: string | string[];
}

function ConsentForm({ onSubmit, signupType }: ConsentFormProps): JSX.Element {
  const { authState } = useAuth();
  const token = authState?.token;

  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [signature, setSignature] = useState<string>('');
  const [date, setDate] = useState<string>('');
  // const [existingConsent, setExistingConsent] = useState<ConsentResponse | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  const router = useRouter();

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

        if (!response.ok) throw new Error('Failed to fetch patient data');

        const patientData: Patient = await response.json();
        setPatient(patientData);
        console.log("Patient Data received: ", patientData);

      } catch (error) {
        console.error('Error fetching patient profile:', error);
      }
    };

    fetchPatientProfile();
  }, [token]);

  const handleSubmit = async (): Promise<void> => {
    if (!token) {
      console.error("No token found, authentication required.");
      showAlert('Authentication Required', 'Please log in to upload recordings.');
      return;
    }

    // First validate required fields
    if (!isChecked || !signature.trim() || !date.trim()) {
      showAlert('Incomplete Form', 'Please complete all required fields and accept the terms.');
      return;
    }

    // Validate patient exists
    if (!patient?.id) {
      console.error('No patient ID available');
      showAlert('User not found', 'Patient information not found. Please try again.');
      return;
    }

    // Validate signature matches patient's unique ID
    if (signature.trim() !== patient.unique_id) {
      showAlert('Signature Mismatch', 'Your digital signature must match your unique ID.');
      return;
    }

    // Validate date is today's date
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (date.trim() !== todayStr) {
      showAlert('Invalid Date', `The date must be today's date (${todayStr}).`);
      return;
    }
    
    // Prepare the form data to match Django model fields
    const signatureData: SignatureData = {
      patient_id: patient.id,
      is_checked: isChecked,
      digital_signature: signature.trim(),
      date: date.trim()
    };
  
    try {
      // Log the submission attempt
      console.log('Submitting signature data:', signatureData);
      
      // Use the patient-specific endpoint
      const endpoint = `${API_URL}/signatures/for_patient/`;
      console.log('Submitting to:', endpoint);
      
      // Make the request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(signatureData)
      });
  
      // Log the response details
      console.log('Response status:', response.status);
  
      // Handle non-200 responses
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Error response body:', errorData);
        } catch (error) {
          const errorText = await response.text();
          console.error('Error response body (text):', error);
          errorMessage = errorText || `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
  
      // Parse and log the success response
      const data: ConsentResponse = await response.json();
      console.log('Success response:', data);
  
      // Update the existing consent data
      // setExistingConsent(data);
  
      // Show success message
      showAlert('Success!', 'Signature submitted!');
      
      // If onSubmit callback provided, call it
      if (onSubmit) {
        onSubmit(data);
      }

      if (signupType === "patient") {
        router.push("/(patient)/dashboard");
      }
  
    } catch (error) {
      // Comprehensive error logging
      console.error('Error type:', (error as Error).constructor.name);
      console.error('Error message:', (error as Error).message);
      console.error('Full error:', error);
  
      // Show error message to user
      showAlert("Error submitting signature",  `${(error as Error).message}`);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.formContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>AUDIO RECORDING CONSENT FORM</Text>
          <View style={styles.divider} />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.paragraph}>
            By using this application, you agree to have your voice recorded for the purpose
            of this app. These recordings will be stored securely and may be used
            for physician analysis. Your privacy is important to us, and your data will be
            handled in accordance with our privacy policy and applicable data protection laws.
          </Text>
        </View>

        <View style={styles.sectionDivider} />
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By signing this form:</Text>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              I voluntarily consent to have my voice recorded during my appointment(s) or interaction(s) with AcoustiCare.
            </Text>
          </View>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              I understand that my voice recordings will be stored securely and treated as protected health information under applicable privacy laws.
            </Text>
          </View>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              I understand how these recordings will be used, as indicated in the purpose section above.
            </Text>
          </View>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              I understand that I may revoke this consent at any time by providing written notice to AcoustiCare and associated medical institutions, and that revoking consent will not affect any actions taken before receiving my revocation.
            </Text>
          </View>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              I understand that refusing to sign this consent will not affect my ability to receive care, treatment, or services from [Facility/Provider Name].
            </Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy and Security</Text>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              Voice recordings will be stored in a secure, HIPAA-compliant system.
            </Text>
          </View>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              Access to recordings will be limited to authorized personnel only.
            </Text>
          </View>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              Recordings will be retained and then securely destroyed.
            </Text>
          </View>
          <View style={styles.bulletPointContainer}>
            <Text style={styles.bulletPoint}>•</Text>
            <Text style={styles.bulletText}>
              Recordings will not be released to third parties without additional authorization, except as permitted or required by law.
            </Text>
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.checkboxContainer}>
          <Checkbox
            value={isChecked}
            onValueChange={setIsChecked}
            style={styles.checkbox}
            color={isChecked ? COLORS.babyBlueDark : undefined}
          />
          <Text style={styles.label}>I have read and agree to the terms outlined above</Text>
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>Signature</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Digital Signature</Text>
          <TextInput
            style={styles.input}
            value={signature}
            onChangeText={setSignature}
            placeholder="Type your unique ID"
            placeholderTextColor={COLORS.disabledText}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={COLORS.disabledText}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            (!isChecked || !signature.trim() || !date.trim()) && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!isChecked || !signature.trim() || !date.trim()}
        >
          <Text style={[
            styles.buttonText,
            (!isChecked || !signature.trim() || !date.trim()) && styles.buttonTextDisabled
          ]}>SUBMIT CONSENT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  formContainer: {
    margin: 16,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.babyBlueDark,
    width: '30%',
    alignSelf: 'center',
  },
  section: {
    backgroundColor: COLORS.sectionBg,
    padding: 16,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.babyBlueDark,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  contentContainer: {
    marginBottom: 20,
    backgroundColor: COLORS.white,
    padding: 0,
  },
  paragraph: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
    lineHeight: 24,
  },
  bulletPointContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: COLORS.babyBlueDark,
    marginRight: 8,
    fontWeight: 'bold',
    width: 15,
  },
  bulletText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
    lineHeight: 22,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    backgroundColor: COLORS.white,
    padding: 0,
  },
  checkbox: {
    marginRight: 12,
    borderColor: COLORS.babyBlueDark,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: COLORS.white,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.babyBlueDark,
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonTextDisabled: {
    color: COLORS.disabledText,
  },
});

export default function ConsentFormWrapper(): JSX.Element {
  const { signupType } = useLocalSearchParams<{ signupType?: string }>();
  return (
    <ProtectedRoute>
      <ConsentForm signupType={signupType} />
    </ProtectedRoute>
  );
}