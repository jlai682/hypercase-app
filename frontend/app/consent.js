import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Checkbox } from 'expo-checkbox';

// Define API URL at the top level
const API_URL = 'http://127.0.0.1:8000/api';

const ConsentForm = ({ onSubmit }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [signature, setSignature] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = async () => {
    // First validate required fields
    if (!isChecked || !signature.trim() || !date.trim()) {
      console.error('Validation failed:', {
        is_checked: isChecked,
        digital_signature: signature.trim(),
        date: date.trim()
      });
      alert('Please complete all required fields and accept the terms.');
      return;
    }
  
    // Prepare the form data to match Django model fields
    const signatureData = {
      is_checked: isChecked,
      digital_signature: signature.trim(),
      date: date.trim()
    };
  
    try {
      // Log the submission attempt
      console.log('Submitting signature data:', signatureData);
      console.log('Submitting to:', `${API_URL}/signatures/`);
  
      // Make the request
      const response = await fetch(`${API_URL}/signatures/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(signatureData)
      });
  
      // Log the response details
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
  
      // Handle non-200 responses
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      // Parse and log the success response
      const data = await response.json();
      console.log('Success response:', data);
  
      // Clear the form
      setSignature('');
      setDate('');
      setIsChecked(false);
  
      // Show success message
      alert('Signature submitted successfully!');
  
    } catch (error) {
      // Comprehensive error logging
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
  
      // Show error message to user
      alert('Error submitting signature. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Audio Recording Consent Form</Text>
        
        <View style={styles.contentContainer}>
          <Text style={styles.paragraph}>
            By using this application, you agree to have your voice recorded for the purpose
            of this app. These recordings will be stored securely and may be used
            for physician analysis. Your privacy is important to us, and your data will be
            handled in accordance with our privacy policy and applicable data protection laws.
          </Text>
        </View>

        <View style={styles.checkboxContainer}>
          <Checkbox
            value={isChecked}
            onValueChange={setIsChecked}
            style={styles.checkbox}
          />
          <Text style={styles.label}>Yes, I consent to have my voice recorded</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Digital Signature</Text>
          <TextInput
            style={styles.input}
            value={signature}
            onChangeText={setSignature}
            placeholder="Type your full name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
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
          <Text style={styles.buttonText}>Submit Consent</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  formContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  contentContainer: {
    marginBottom: 20,
  },
  paragraph: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 12,
    lineHeight: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConsentForm;