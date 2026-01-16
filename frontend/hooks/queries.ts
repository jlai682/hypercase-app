import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthContext';
import { apiFetch } from '@/lib/api';
import { Patient, Survey, Provider, RecordingRequest, ConnectedPatient } from '@/types';

// ============================================
// Patient Hooks
// ============================================

export function usePatientProfile() {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['patient', 'profile'],
    queryFn: () => apiFetch<Patient>('/api/patientManagement/profile/', authState.token!),
    enabled: !!authState.token,
  });
}

export function usePatientSurveys() {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['patient', 'surveys'],
    queryFn: () => apiFetch<Survey[]>('/api/surveyManagement/get_surveys_by_patient/', authState.token!),
    enabled: !!authState.token,
  });
}

export function usePatientProvider() {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['patient', 'provider'],
    queryFn: async () => {
      const data = await apiFetch<{ provider: Provider }>('/api/providerManagement/get_provider_by_patient/', authState.token!);
      return data.provider;
    },
    enabled: !!authState.token,
  });
}

export function useRecordingRequests() {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['recording-requests'],
    queryFn: () => apiFetch<RecordingRequest[]>('/api/recordings/recording-requests/my-requests/', authState.token!),
    enabled: !!authState.token,
  });
}

export function useSurveyQuestions(surveyId: string | undefined) {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => apiFetch<{
      survey_title: string;
      multiple_choice_responses: any[];
      open_responses: any[];
    }>(`/api/surveyManagement/survey_questions/${surveyId}/`, authState.token!),
    enabled: !!authState.token && !!surveyId,
  });
}

// ============================================
// Provider Hooks
// ============================================

export function useProviderProfile() {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['provider', 'profile'],
    queryFn: async () => {
      const data = await apiFetch<{ provider: { lastName: string; firstName?: string } }>('/api/providerManagement/providerInfo/', authState.token!);
      return data.provider;
    },
    enabled: !!authState.token,
  });
}

export function useConnectedPatients() {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['provider', 'patients'],
    queryFn: async () => {
      const data = await apiFetch<{ patients: ConnectedPatient[] }>('/api/providerManagement/myPatients/', authState.token!);
      return data.patients || [];
    },
    enabled: !!authState.token,
  });
}

// ============================================
// Mutations
// ============================================

export function useSubmitSurvey() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, responses }: { surveyId: string; responses: any }) =>
      apiFetch(`/api/surveyManagement/submit/${surveyId}/`, authState.token!, {
        method: 'POST',
        body: JSON.stringify(responses),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', 'surveys'] });
    },
  });
}

export function useSearchPatient() {
  const { authState } = useAuth();
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<{ patient: Patient }>('/api/providerManagement/search_patient/', authState.token!, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      }),
  });
}

export function useConnectToPatient() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientEmail: string) =>
      apiFetch('/api/providerManagement/connect/', authState.token!, {
        method: 'POST',
        body: JSON.stringify({ patient_email: patientEmail }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'patients'] });
    },
  });
}
