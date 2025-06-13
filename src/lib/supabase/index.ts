// Export all Supabase client functionality from a single entry point

// Export the Supabase client itself
export { supabase } from "./client";

// Re-export types
export * from "./types";

// Re-export auth functions (excluding User type to avoid conflict)
export {
  getCurrentUser,
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
} from "./auth";

// Re-export sessions functions (excluding types to avoid conflict)
export {
  createSession,
  getSessionByCode,
  endSession,
  addSessionParticipant,
  getParticipantsForSession,
  getPendingParticipantsForSession,
  subscribeToSessionParticipants,
  checkParticipantStatus,
  approveParticipant,
  rejectParticipant,
  subscribeToParticipantStatus,
} from "./sessions";

// Re-export lesson plans functions (excluding types to avoid conflict)
export { getLessonPlanById } from "./lessonPlans";

// Re-export presentations functions (excluding types to avoid conflict)
export {
  createLessonPresentation,
  getLessonPresentationByCode,
  updateLessonPresentationCardIndex,
  endLessonPresentation,
  subscribeToLessonPresentation,
} from "./presentations";

// Re-export feedback functions (excluding types to avoid conflict)
export {
  submitFeedback,
  getFeedbackForSession,
  subscribeToSessionFeedback,
  submitTeachingFeedback,
  getStudentFeedbackForCard,
  getTeachingFeedbackForPresentation,
  subscribeToTeachingFeedback,
  getCardFeedbackByStudent,
} from "./feedback";

// Re-export messages functions
export {
  sendTeacherMessage,
  getTeacherMessagesForPresentation,
  subscribeToTeacherMessages,
} from "./messages";

// Re-export questions functions
export {
  submitTeachingQuestion,
  markQuestionAsAnswered,
  getTeachingQuestionsForPresentation,
  subscribeToTeachingQuestions,
} from "./questions";

// Re-export utility functions
export { generateRandomName } from "./utils";