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
}

export interface ProcessedLesson {
  title: string;
  objectives: string[];
  sections: LessonSection[];
  duration: string;
  materials: string[];
}