import type { CardAttachment } from './supabase/types';

export interface LessonPlan {
  id: string;
  title: string;
  objectives: string[];
  sections: LessonSection[];
  duration: string;
  materials: string[];
  created_at: string;
  level?: string;
}

export interface LessonSection {
  id: string;
  title: string;
  duration: string;
  content: string;
  activities: string[];
  assessment?: string;
}

export interface ProcessedLesson {
  id: string;
  title: string;
  summary: string;
  objectives: string[];
  sections: LessonSection[];
  duration: string;
  materials: string[];
  level: string;
  topic_background?: string;
  success_criteria?: string[];
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
  remedialActivity?: string;     // Simplified content for students needing additional support
  isRemedialEnabled?: boolean;   // Controls visibility/availability of remedial content
  attachments?: CardAttachment[];
  extensionActivity?: string; // Extension activity for fast finishers
}

export interface LessonPresentation {
  id: string;
  lesson_id: string;
  session_code: string;
  session_id: string;
  current_card_index: number;
  cards: LessonCard[];
  active: boolean;
  created_at: string;
  realtime_enabled: boolean;
  wordle_word?: string | null;
  lesson_state: boolean;
}

export interface TeacherMessage {
  id: string;
  presentation_id: string;
  teacher_name: string;
  message_content: string;
  created_at: string;
}

export type ParticipantStatus = 'pending' | 'approved' | 'rejected';

export interface ExtensionRequest {
  id: string;
  presentation_id: string;
  student_name: string;
  card_index: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface RemedialAssignment {
  id: string;
  presentation_id: string;
  student_name: string;
  card_id?: string; // If null, applies to all cards
  created_at: string;
}