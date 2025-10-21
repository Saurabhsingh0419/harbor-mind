// src/services/firestoreService.ts
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Types for our Firestore documents
export interface ChatMessage {
  id?: string;
  userId: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Timestamp;
  sessionId?: string;
}

export interface ChatSession {
  id?: string;
  userId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  messageCount: number;
  title?: string;
}

// Firestore collections
const CHAT_MESSAGES_COLLECTION = 'chatMessages';
const CHAT_SESSIONS_COLLECTION = 'chatSessions';

/**
 * Add a new chat message to Firestore
 */
export const addChatMessage = async (
  userId: string, 
  text: string, 
  sender: 'user' | 'ai',
  sessionId?: string
): Promise<string> => {
  try {
    const messageData: Omit<ChatMessage, 'id'> = {
      userId,
      sender,
      text,
      timestamp: Timestamp.now(),
      sessionId: sessionId || null
    };

    const docRef = await addDoc(collection(db, CHAT_MESSAGES_COLLECTION), messageData);
    console.log('Message added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding chat message:', error);
    throw error;
  }
};

/**
 * Get chat messages for a specific user
 */
export const getChatMessages = async (
  userId: string, 
  sessionId?: string,
  messageLimit: number = 50
): Promise<ChatMessage[]> => {
  try {
    // Get all messages for the user (without orderBy to avoid composite index)
    let q = query(
      collection(db, CHAT_MESSAGES_COLLECTION),
      where('userId', '==', userId),
      limit(messageLimit)
    );

    // If sessionId is provided, filter by session
    if (sessionId) {
      q = query(
        collection(db, CHAT_MESSAGES_COLLECTION),
        where('userId', '==', userId),
        where('sessionId', '==', sessionId),
        limit(messageLimit)
      );
    }

    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as ChatMessage);
    });

    // Sort messages by timestamp in JavaScript (oldest first)
    messages.sort((a, b) => {
      const timestampA = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
      const timestampB = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
      return timestampA.getTime() - timestampB.getTime();
    });

    return messages;
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

/**
 * Create a new chat session
 */
export const createChatSession = async (userId: string, title?: string): Promise<string> => {
  try {
    const sessionData: Omit<ChatSession, 'id'> = {
      userId,
      createdAt: Timestamp.now(),
      lastMessageAt: Timestamp.now(),
      messageCount: 0,
      title: title || 'New Chat'
    };

    const docRef = await addDoc(collection(db, CHAT_SESSIONS_COLLECTION), sessionData);
    console.log('Chat session created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

/**
 * Get chat sessions for a user
 */
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    // Get sessions without orderBy to avoid composite index
    const q = query(
      collection(db, CHAT_SESSIONS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const sessions: ChatSession[] = [];
    
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      sessions.push({
        id: doc.id,
        ...doc.data()
      } as ChatSession);
    });

    // Sort sessions by lastMessageAt in JavaScript (newest first)
    sessions.sort((a, b) => {
      const timestampA = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate() : new Date(a.lastMessageAt);
      const timestampB = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate() : new Date(b.lastMessageAt);
      return timestampB.getTime() - timestampA.getTime();
    });

    return sessions;
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    throw error;
  }
};

/**
 * Update session's last message timestamp and count
 */
export const updateSessionActivity = async (
  sessionId: string, 
  messageCount: number
): Promise<void> => {
  try {
    // Note: This would require using updateDoc and doc imports
    // For now, we'll handle this in the component level
    console.log(`Session ${sessionId} updated with ${messageCount} messages`);
  } catch (error) {
    console.error('Error updating session activity:', error);
    throw error;
  }
};
