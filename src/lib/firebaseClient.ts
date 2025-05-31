import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, addDoc, getDoc, updateDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ProcessedLesson } from './types';
import { v4 as uuidv4 } from 'uuid';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Types
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
}

export interface LessonPlan {
  id: string;
  title: string;
  processed_content: ProcessedLesson | null;
  created_at: string;
}

// Lesson Plan Functions
export const saveLessonPlan = async (
  title: string,
  pdfFile: File
): Promise<string> => {
  try {
    if (!title || !pdfFile) {
      throw new Error('Title and PDF file are required');
    }

    // Create lesson plan document
    const lessonPlanRef = await addDoc(collection(db, 'lesson_plans'), {
      title,
      created_at: new Date().toISOString(),
      processed_content: null
    });

    // Upload PDF to storage
    const filePath = `lesson_plans/${lessonPlanRef.id}/${pdfFile.name}`;
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, pdfFile);
    const downloadUrl = await getDownloadURL(storageRef);

    // Update lesson plan with file path
    await updateDoc(lessonPlanRef, {
      pdf_url: downloadUrl
    });

    return lessonPlanRef.id;
  } catch (err) {
    console.error('Error saving lesson plan:', err);
    throw err;
  }
};

export const getLessonPlan = async (id: string): Promise<LessonPlan | null> => {
  try {
    const docRef = doc(db, 'lesson_plans', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as LessonPlan;
  } catch (err) {
    console.error('Error getting lesson plan:', err);
    return null;
  }
};

// Session Functions
export const createSession = async (teacherName: string): Promise<Session | null> => {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const session = {
      code,
      teacher_name: teacherName,
      active: true,
      created_at: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'sessions'), session);
    return { id: docRef.id, ...session };
  } catch (err) {
    console.error('Error creating session:', err);
    return null;
  }
};

export const getSessionByCode = async (code: string): Promise<Session | null> => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('code', '==', code),
      where('active', '==', true)
    );
    
    const querySnapshot = await getDoc(q);
    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Session;
  } catch (err) {
    console.error('Error getting session:', err);
    return null;
  }
};

export const endSession = async (code: string): Promise<boolean> => {
  try {
    const q = query(collection(db, 'sessions'), where('code', '==', code));
    const querySnapshot = await getDoc(q);
    
    if (!querySnapshot.empty) {
      const docRef = doc(db, 'sessions', querySnapshot.docs[0].id);
      await updateDoc(docRef, { active: false });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error ending session:', err);
    return false;
  }
};

// Participant Functions
export const addSessionParticipant = async (
  sessionCode: string,
  studentName: string
): Promise<SessionParticipant | null> => {
  try {
    const participant = {
      session_code: sessionCode,
      student_name: studentName,
      joined_at: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'session_participants'), participant);
    return { id: docRef.id, ...participant };
  } catch (err) {
    console.error('Error adding participant:', err);
    return null;
  }
};

export const getParticipantsForSession = async (sessionCode: string): Promise<SessionParticipant[]> => {
  try {
    const q = query(
      collection(db, 'session_participants'),
      where('session_code', '==', sessionCode),
      orderBy('joined_at')
    );
    
    const querySnapshot = await getDoc(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SessionParticipant[];
  } catch (err) {
    console.error('Error getting participants:', err);
    return [];
  }
};

// Feedback Functions
export const submitFeedback = async (
  sessionCode: string,
  studentName: string,
  value: string
): Promise<Feedback | null> => {
  try {
    const feedback = {
      session_code: sessionCode,
      student_name: studentName,
      value,
      created_at: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'feedback'), feedback);
    return { id: docRef.id, ...feedback };
  } catch (err) {
    console.error('Error submitting feedback:', err);
    return null;
  }
};

export const getFeedbackForSession = async (sessionCode: string): Promise<Feedback[]> => {
  try {
    const q = query(
      collection(db, 'feedback'),
      where('session_code', '==', sessionCode),
      orderBy('created_at', 'desc')
    );
    
    const querySnapshot = await getDoc(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Feedback[];
  } catch (err) {
    console.error('Error getting feedback:', err);
    return [];
  }
};

// Real-time subscriptions
export const subscribeToSessionParticipants = (
  sessionCode: string,
  callback: (participant: SessionParticipant) => void
) => {
  const q = query(
    collection(db, 'session_participants'),
    where('session_code', '==', sessionCode)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback({ id: change.doc.id, ...change.doc.data() } as SessionParticipant);
      }
    });
  });
};

export const subscribeToSessionFeedback = (
  sessionCode: string,
  callback: (feedback: Feedback) => void
) => {
  const q = query(
    collection(db, 'feedback'),
    where('session_code', '==', sessionCode)
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback({ id: change.doc.id, ...change.doc.data() } as Feedback);
      }
    });
  });
};

export const subscribeLessonPlanUpdates = (
  lessonPlanId: string,
  callback: (lessonPlan: LessonPlan) => void
) => {
  const docRef = doc(db, 'lesson_plans', lessonPlanId);
  
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() } as LessonPlan);
    }
  });
};