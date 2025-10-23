// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import { 
  Timestamp,
  collection, 
  query, 
  orderBy, 
  where,
  onSnapshot, // Import the real-time listener
  QuerySnapshot,
  DocumentData,
  QueryDocumentSnapshot // Import this type
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig'; // Import the db instance
import { 
  // We still use these types and services for sessions
  createChatSession,
  getChatSessions,
  addChatMessage, 
  ChatMessage, // Keep this type
  ChatSession
} from '../services/firestoreService';

/**
 * Hook for managing chat messages IN REAL-TIME
 */
export const useChatMessages = (sessionId?: string) => {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setMessages([]); // Clear messages if no user
      return;
    }

    setLoading(true);
    setError(null);
    console.log(`Setting up real-time listener for userId: ${userId}`);

    // Create the query.
    let q = query(
      collection(db, "ai-chats"), // <-- Using the correct 'ai-chats' collection
      where("userId", "==", userId),
      orderBy("timestamp", "asc") // Order by time so new messages appear at the bottom
    );

    // If a sessionId is provided, add it to the query
    if (sessionId) {
      // NOTE: This query will require a composite index in Firestore
      // (ai-chats, userId ASC, sessionId ASC, timestamp ASC)
      // The console log error will provide a link to create it.
      q = query(
        collection(db, "ai-chats"), 
        where("userId", "==", userId),
        where("sessionId", "==", sessionId), // Add session filter
        orderBy("timestamp", "asc")
      );
    }

    // Use onSnapshot for real-time updates
    const unsubscribe = onSnapshot(q, 
      (querySnapshot: QuerySnapshot<DocumentData>) => {
        const fetchedMessages: ChatMessage[] = [];
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          fetchedMessages.push({
            id: doc.id,
            ...doc.data()
          } as ChatMessage);
        });
        setMessages(fetchedMessages);
        setLoading(false);
        console.log(`Snapshot received, ${fetchedMessages.length} messages loaded.`);
      },
      (err) => {
        console.error('Error with Firestore snapshot:', err);
        setError(err instanceof Error ? err.message : 'Failed to load messages');
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("Cleaning up snapshot listener.");
      unsubscribe();
    };
    
  }, [userId, sessionId]); // Re-run if user or session changes

  // This function is kept for consistency, but AIChatScreen.tsx doesn't use it.
  const addMessage = async (text: string, sender: 'user' | 'ai') => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }
    try {
      await addChatMessage(userId, text, sender, sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
    }
  };


  return {
    messages,
    loading,
    error,
    addMessage,
    setMessages
  };
};

/**
 * Hook for managing chat sessions (Unchanged)
 */
export const useChatSessions = () => {
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const loadSessions = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedSessions = await getChatSessions(userId);
        setSessions(fetchedSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    loadSessions();
  }, [userId]);

  const createSession = async (title?: string) => {
    if (!userId) {
      setError('User not authenticated');
      return null;
    }
    try {
      setError(null);
      const sessionId = await createChatSession(userId, title);
      const newSession: ChatSession = {
        id: sessionId,
        userId,
        createdAt: Timestamp.now(),
        lastMessageAt: Timestamp.now(),
        messageCount: 0,
        title: title || 'New Chat'
      };
      setSessions(prev => [newSession, ...prev]);
      return sessionId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    }
  };

  return {
    sessions,
    loading,
    error,
    createSession
  };
};

/**
 * Hook for real-time chat functionality
 * (This hook is now just a wrapper for useChatMessages)
 */
export const useRealtimeChat = (sessionId?: string) => {
  const { messages, loading, error } = useChatMessages(sessionId);
  
  // AIChatScreen.tsx provides its own 'isSending' and 'sendMessage'
  return {
    messages,
    loading,
    error,
    isSending: false, // This is controlled by AIChatScreen
    sendMessage: async () => { console.warn("useRealtimeChat.sendMessage is deprecated."); }
  };
};