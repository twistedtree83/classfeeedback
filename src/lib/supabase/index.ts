// Export all Supabase client functionality from a single entry point

// Export the Supabase client itself
export { supabase } from './client';

// Re-export types
export * from './types';

// Re-export auth functions
export * from './auth';

// Re-export sessions functions
export * from './sessions';

// Re-export lesson plans functions
export * from './lessonPlans';

// Re-export presentations functions
export * from './presentations';

// Re-export feedback functions
export * from './feedback';

// Re-export messages functions
export * from './messages';