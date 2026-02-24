// Core domain entities matching your backend models

export interface Patient {
  id: string | number;
  unique_id: string;
  age?: number;
  date_joined?: string;
}

export interface Provider {
  id: string | number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Survey {
  id: string | number;
  title: string;
  issue_date: string;
  response_date?: string;
  status: 'sent' | 'completed';
  patient_id?: string | number;
}

export interface Recording {
  id: string | number;
  title: string;
  description?: string;
  file_url: string;
  created_at: string;
  patient_id?: string | number;
  analytics_status?: string;
}

export interface RecordingRequest {
  id: string | number;
  title: string;
  description: string;
  status: 'sent' | 'completed';
  due_date?: string;
  issue_date: string;
  patient_id: string | number;
  recording_id?: string | number;
}
