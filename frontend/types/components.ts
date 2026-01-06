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
  onRecordingComplete?: (uri: string) => void;
  requestId?: string | number;
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

export interface AuthProps {
  authState: AuthState;
  onRegister: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    signupType: string,
    age?: string
  ) => Promise<any>;
  onLogin: (email: string, password: string, loginType: string) => Promise<any>;
  onLogout: () => Promise<any>;
}
