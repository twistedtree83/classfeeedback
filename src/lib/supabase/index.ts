// Export the Supabase client itself
export { supabase } from "./client";

// Re-export types
export * from "./types";

// Re-export auth functions
export {
  getCurrentUser,
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
} from "./auth";

// Re-export sessions functions
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
  getParticipantByCodeAndName,
} from "./sessions";

// Re-export lesson plans functions
export { getLessonPlanById } from "./lessonPlans";

// Re-export presentations functions
export {
  createLessonPresentation,
  getLessonPresentationByCode,
  updateLessonPresentationCardIndex,
  updateLessonPresentation,
  endLessonPresentation,
  subscribeToLessonPresentation,
} from "./presentations";

// Re-export feedback functions
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

// Re-export extension requests functions
export {
  submitExtensionRequest,
  approveExtensionRequest,
  rejectExtensionRequest,
  getExtensionRequestsForPresentation,
  getStudentExtensionRequestStatus,
  subscribeToExtensionRequests,
} from "./extensions";

// Re-export vocabulary functions
export {
  saveVocabularyTerms,
  getVocabularyTermsForLesson,
  deleteVocabularyTermsForLesson,
  getVocabularyTermById,
} from "./vocabulary";

// Re-export utility functions
export { generateRandomName } from "./utils";

// Re-export utility functions from utils.ts
export { groupFeedbackByType } from "../utils";