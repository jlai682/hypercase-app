import { Patient, Survey, RecordingRequest } from './models';

// Navigation
export interface NavBarProps {
  patient?: Patient | null;
}

export interface BackButtonProps {
  route?: string;
}

// Patient components
export interface RecordingRequestsProps {
  sentRequests: string; // JSON stringified array
  completedRequests: string; // JSON stringified array
  onSelectRequest: (request: RecordingRequest) => void;
  patient: string | null;
}

export interface PreviousRecordingsProps {
  patient: string | null;
}

export interface RecordButtonProps {
  isRecording: boolean;
  stopRecording: () => void | Promise<void>;
  startRecording: () => void | Promise<void>;
}

export interface NameRecordingModalProps {
  visible: boolean;
  recordingUri: string | Blob | null;
  patient: Patient | null;
  request?: RecordingRequest;
  onSave: (recordingName: string) => Promise<void>;
  onCancel: () => void;
}

// Shared components
export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface SurveyDisplayProps {
  survey: Survey;
  role: 'patient' | 'provider';
}

// Auth
export interface AuthState {
  token: string | null;
  authenticated: boolean | null;
}
