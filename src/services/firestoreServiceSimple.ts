// src/services/firestoreServiceSimple.ts
// Alternative Firestore service that avoids composite index requirements
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  limit,
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

    const docRef = await addDoc(collection(db, 'chatMessages'), messageData);
    console.log('Message added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding chat message:', error);
    throw error;
  }
};

/**
 * Get chat messages for a specific user (simple version)
 */
export const getChatMessages = async (
  userId: string, 
  sessionId?: string,
  messageLimit: number = 50
): Promise<ChatMessage[]> => {
  try {
    // Simple query - just get all messages for user
    const q = query(
      collection(db, 'chatMessages'),
      where('userId', '==', userId),
      limit(messageLimit)
    );

    const querySnapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    
    querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        userId: data.userId,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp,
        sessionId: data.sessionId
      } as ChatMessage);
    });

    // Sort by timestamp in JavaScript (oldest first)
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
