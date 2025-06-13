// Re-export all Supabase client functionality from a single entry point

// Export the Supabase client itself
export { supabase } from './supabase/client';

// Re-export types
export * from './supabase/types';

// Re-export auth functions
export * from './supabase/auth';

// Re-export sessions functions
export * from './supabase/sessions';

// Re-export lesson plans functions
export * from './supabase/lessonPlans';

// Re-export presentations functions
export * from './supabase/presentations';

// Re-export feedback functions
export * from './supabase/feedback';

// Re-export messages functions
export * from './supabase/messages';

// Re-export questions functions
export * from './supabase/questions';

// Re-export utility functions
export { generateRandomName } from './supabase/utils';

// Re-export utility functions from utils.ts
export { groupFeedbackByType } from './utils';