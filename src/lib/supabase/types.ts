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
  user_id?: string;
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

export interface CardAttachment {
  id: string;
  type: 'image' | 'file' | 'link';
  name: string;
  url: string;
  fileType?: string; // mime type for files
  size?: number; // size in bytes for files
  previewUrl?: string; // thumbnail for images
}

export interface LessonCard {
  id: string;
  type: 'objective' | 'material' | 'section' | 'activity' | 'custom' | 'topic_background';
  title: string;
  content: string;
  duration: string | null;
  sectionId: string | null;
  activityIndex: number | null;
  studentFriendly?: boolean;
  originalContent?: string;
  differentiatedContent?: string;
  isDifferentiated?: boolean;
  attachments?: CardAttachment[];
}