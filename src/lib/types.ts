export interface LessonPlan {
  id: string;
  title: string;
  objectives: string[];
  sections: LessonSection[];
  duration: string;
  materials: string[];
  created_at: string;
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
}

export interface LessonCard {
  id: string;
  type: 'objective' | 'material' | 'section' | 'activity' | 'custom';
  title: string;
  content: string;
  duration: string | null;
  sectionId: string | null;
  activityIndex: number | null;
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
}

export interface TeacherMessage {
  id: string;
  presentation_id: string;
  teacher_name: string;
  message_content: string;
  created_at: string;
}