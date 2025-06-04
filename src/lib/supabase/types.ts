// Common types used across the Supabase client modules

// Auth types
export type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    title?: string;
  };
};

// Session types
export interface Session {
  id: string;
  code: string;
  created_at: string;
  teacher_name: string;
  active: boolean;
}

export interface Feedback {
  id: string;
  session_code: string;
  student_name: string;
  value: string;
  created_at: string;
}

export interface SessionParticipant {
  id: string;
  session_code: string;
  student_name: string;
  joined_at: string;
  status: string;
}

export type ParticipantStatus = 'pending' | 'approved' | 'rejected';

// Lesson plan types
export interface LessonPlan {
  id: string;
  title: string;
  processed_content: any | null; // Using any here, but should be a more specific type
  created_at: string;
  level?: string;
}

// Presentation types
export interface LessonPresentation {
  id: string;
  lesson_id: string;
  session_code: string;
  session_id: string;
  current_card_index: number;
  cards: any[]; // Should be replaced with a proper Card type
  active: boolean;
  created_at: string;
  realtime_enabled: boolean;
}

// Message types
export interface TeacherMessage {
  id: string;
  presentation_id: string;
  teacher_name: string;
  message_content: string;
  created_at: string;
}