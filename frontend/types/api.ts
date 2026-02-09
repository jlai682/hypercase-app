import { Patient, Provider, Survey, Recording, RecordingRequest } from './models';

// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Authentication
export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  access: string;
  refresh: string;
  user: Patient | Provider;
}

export interface TokenRefreshResponse {
  access: string;
}

// Patient-specific responses
export interface PatientProfileResponse {
  patient: Patient;
}

export interface SurveysResponse {
  surveys: Survey[];
}

export interface RecordingsResponse {
  recordings: Recording[];
}

export interface RecordingRequestsResponse {
  status: 'sent' | 'completed',
  requests: RecordingRequest[];
}

// Provider-specific responses
export interface ConnectedPatient {
  patient: Patient;
  connection_date?: string;
}

export interface ProviderPatientsResponse {
  patients: ConnectedPatient[];
}

export interface ProviderInfoResponse {
  provider: Provider;
}

export interface SearchPatientResponse {
  patient: Patient | null;
  error?: string;
}

// Survey-specific - Shared building blocks only
export interface Option {
  id: number;
  option: string;
}

export interface Question {
  id: number;
  question_description: string;
}

export interface MultipleChoiceQuestion {
  question: Question;
  options: Option[];
  is_multi_select?: boolean;
}

export interface OpenResponseQuestion {
  question: Question;
}

export interface SurveyQuestion {
  id: string | number;
  question_description: string;
  question_type: 'open' | 'multiple_choice';
  options?: [
    id: string | number,
    option: string,
  ];
}

export interface SurveyQuestionsResponse {
  survey_title: string;
  multiple_choice_responses: [
    question: SurveyQuestion,
    options: [ {id: string | number; option: string }],
    response?: string,
    selected_options?: string[],
  ];
  open_responses: [
    question: SurveyQuestion,
    response?: string,
  ];
}

export interface AllQuestionsResponse {
  open_questions: SurveyQuestion[];
  multiple_choice_questions: SurveyQuestion[];
}

export interface CreateSurveyRequest {
  title: string;
  patient_id: string | number;
  open_question_ids: (string | number)[];
  mc_question_ids: (string | number)[];
}

export interface SurveySubmitRequest {
  multiple_choice_responses: [
    questionObject: {
      question: SurveyQuestion;
      options: [ { id: string | number; option: string } ],
    },
    response: { id: string | number; option: string }[] | null,
  ],
  open_responses: Record<number, {
    questionObject: {
      question: SurveyQuestion;
    };
    response: string;
  }>;
}

// Consent
export interface ConsentSubmission {
  patient_id: string | number;
  is_checked: boolean;
  digital_signature: string;
  date: string;
}

export interface ConsentResponse extends ConsentSubmission {
  id: string | number;
  created_at?: string;
  updated_at?: string;
}

// Recording request
export interface CreateRecordingRequest {
  patient_id: string | number;
  title: string;
  description: string;
  due_date: string;
}
