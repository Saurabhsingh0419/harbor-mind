// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import { 
  Timestamp,
  collection, 
  query, 
  orderBy, 
  limit, 
  where,
  onSnapshot, // Import the real-time listener
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig'; // Import the db instance
import { 
  // We still use these types and services for sessions
  createChatSession,
  getChatSessions,
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

  // Load messages when userId or sessionId changes
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
    // NOTE: This requires the same Firestore index you created for the backend:
    // Collection: ai-chats, Fields: userId (asc), timestamp (asc)
    let q = query(
      collection(db, "ai-chats"), // <-- CORRECTED COLLECTION NAME
      where("userId", "==", userId),
      orderBy("timestamp", "asc") // Order by time so new messages appear at the bottom
    );

    // If a sessionId is provided, add it to the query
    if (sessionId) {
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
        querySnapshot.forEach((doc) => {
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

  // The 'addMessage' function from the original hook is no longer needed
  // because the backend handles all message creation, and the snapshot
  // listener handles updating the local state.

  return {
    messages,
    loading,
    error,
    setMessages
    // addMessage function is removed
  };
};

/**
 * Hook for managing chat sessions
 * (This can remain as-is for now, as it doesn't need to be real-time)
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
        console.error('Error loading sessions:', err);
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
      console.error('Error creating session:', err);
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
 * This hook now just passes through the real-time data from useChatMessages
 * and provides the 'isSending' state for the UI.
 */
export const useRealtimeChat = (sessionId?: string) => {
  const { messages, loading, error } = useChatMessages(sessionId);
  
  // AIChatScreen.tsx manages its own 'isSending' state, 
  // so we don't need to provide it from here.
  // We also don't provide 'sendMessage' because AIChatScreen.tsx
  // has its own 'handleSendMessage' that calls the backend API.

  return {
    messages,
    loading,
    error,
    isSending: false, // This is now controlled by AIChatScreen.tsx
    sendMessage: async () => { console.warn("useRealtimeChat.sendMessage is deprecated. Use handleSendMessage in AIChatScreen."); }
  };
};