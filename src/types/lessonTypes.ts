export interface ImprovementArea {
  id: string;
  section: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  type: 'missing' | 'unclear' | 'incomplete';
  fieldPath: string; // e.g., "objectives", "sections.0.activities"
}

export interface ImprovedField {
  fieldPath: string;
  originalValue: any;
  suggestedValue: any;
  approved: boolean;
}