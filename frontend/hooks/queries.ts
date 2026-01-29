import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthContext';
import { apiFetch } from '@/lib/api';
import { Patient, Survey, Provider, RecordingRequest, ConnectedPatient, Recording } from '@/types';

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

export function useSearchProviders(searchQuery: string) {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['providers', 'search', searchQuery],
    queryFn: async () => {
      const queryParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const data = await apiFetch<{ providers: Provider[] }>(`/api/providerManagement/search/${queryParam}`, authState.token!);
      return data.providers || [];
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
    onSuccess: (_, variables) => {
      // Invalidate the surveys list so status updates to 'completed'
      queryClient.invalidateQueries({ queryKey: ['patient', 'surveys'] });
      // Invalidate the specific survey's questions/responses so the view shows the submitted answers
      queryClient.invalidateQueries({ queryKey: ['survey', variables.surveyId] });
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

// ============================================
// Provider - Patient Detail Hooks
// ============================================

export function usePatientByEmail(email: string | undefined) {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['patient', 'byEmail', email],
    queryFn: async () => {
      const data = await apiFetch<{ patient: Patient }>('/api/providerManagement/search_patient/', authState.token!, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return data.patient;
    },
    enabled: !!authState.token && !!email,
  });
}

export function useSurveysByPatient(patientId: string | number | undefined) {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['surveys', 'byPatient', patientId],
    queryFn: () => apiFetch<Survey[]>(`/api/surveyManagement/get_surveys/${patientId}/`, authState.token!),
    enabled: !!authState.token && !!patientId,
  });
}

export function useRecordingsByPatient(patientId: string | number | undefined) {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['recordings', 'byPatient', patientId],
    queryFn: () => apiFetch<Recording[]>(`/api/recordings/patient/${patientId}/`, authState.token!),
    enabled: !!authState.token && !!patientId,
  });
}

export function useRecordingRequestsByPatient(patientId: string | number | undefined) {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['recording-requests', 'byPatient', patientId],
    queryFn: () => apiFetch<RecordingRequest[]>(`/api/recordings/recording-requests/patient/${patientId}/`, authState.token!),
    enabled: !!authState.token && !!patientId,
  });
}

export function useRecordingAnalytics(recordingId: string | number | undefined) {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['recording', 'analytics', recordingId],
    queryFn: () => apiFetch<any>(`/api/recordings/${recordingId}/analytics/`, authState.token!),
    enabled: !!authState.token && !!recordingId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 3000;
      }
      return false;
    },
  });
}

export function useAllQuestions() {
  const { authState } = useAuth();
  return useQuery({
    queryKey: ['questions', 'all'],
    queryFn: () => apiFetch<{
      open_questions: any[];
      multiple_choice_questions: any[];
    }>('/api/surveyManagement/get_all_questions/', authState.token!),
    enabled: !!authState.token,
  });
}

// ============================================
// Patient - Recording Hooks
// ============================================

export function usePatientRecordings() {
  const { authState } = useAuth();
  const profileQuery = usePatientProfile();
  const patientId = profileQuery.data?.id;

  return useQuery({
    queryKey: ['patient', 'recordings', patientId],
    queryFn: () => apiFetch<Recording[]>(`/api/recordings/patient/${patientId}/`, authState.token!),
    enabled: !!authState.token && !!patientId,
  });
}

// ============================================
// Provider Mutations
// ============================================

export function useCreateRecordingRequest() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, title, description, dueDate }: {
      patientId: string | number;
      title: string;
      description: string;
      dueDate: string;
    }) =>
      apiFetch('/api/recordings/recording-requests/create/', authState.token!, {
        method: 'POST',
        body: JSON.stringify({
          patient_id: patientId,
          title,
          description,
          due_date: dueDate,
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recording-requests', 'byPatient', variables.patientId] });
    },
  });
}

export function useDeleteRecording() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordingId: string | number) =>
      apiFetch(`/api/recordings/${recordingId}/delete/`, authState.token!, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });
}

export function useDeletePatientConnection() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patientId: string | number) =>
      apiFetch('/api/providerManagement/delete_patient_provider_connection/', authState.token!, {
        method: 'DELETE',
        body: JSON.stringify({ patient_id: patientId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'patients'] });
    },
  });
}

export function useCreateSurvey() {
  const { authState } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, patientId, openQuestionIds, mcQuestionIds }: {
      title: string;
      patientId: string | number;
      openQuestionIds: number[];
      mcQuestionIds: number[];
    }) =>
      apiFetch('/api/surveyManagement/create_survey/', authState.token!, {
        method: 'POST',
        body: JSON.stringify({
          title,
          patient_id: patientId,
          open_question_ids: openQuestionIds,
          mc_question_ids: mcQuestionIds,
        }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['surveys', 'byPatient', variables.patientId] });
    },
  });
}
