// src/hooks/useFirestore.ts
import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { 
  addChatMessage, 
  getChatMessages, 
  createChatSession,
  getChatSessions,
  ChatMessage,
  ChatSession
} from '../services/firestoreService';

/**
 * Hook for managing chat messages
 */
export const useChatMessages = (sessionId?: string) => {
  const { userId } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load messages when userId or sessionId changes
  useEffect(() => {
    if (!userId) return;

    const loadMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedMessages = await getChatMessages(userId, sessionId);
        setMessages(fetchedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
        console.error('Error loading messages:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [userId, sessionId]);

  const addMessage = async (text: string, sender: 'user' | 'ai') => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      const messageId = await addChatMessage(userId, text, sender, sessionId);
      
      // Add the new message to local state
      const newMessage: ChatMessage = {
        id: messageId,
        userId,
        sender,
        text,
  timestamp: Timestamp.now(),
        sessionId
      };
      
      setMessages(prev => [...prev, newMessage]);
      return messageId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add message');
      console.error('Error adding message:', err);
      throw err;
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
 * Hook for managing chat sessions
 */
export const useChatSessions = () => {
  const { userId } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sessions when userId changes
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
      
      // Add the new session to local state
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
 */
export const useRealtimeChat = (sessionId?: string) => {
  const { messages, loading, error, addMessage } = useChatMessages(sessionId);
  const [isSending, setIsSending] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    try {
      // Add user message
      await addMessage(text, 'user');
      
      // Simulate AI response (replace with actual AI integration)
      setTimeout(async () => {
        const aiResponse = `I understand you said: "${text}". This is a placeholder response. In a real implementation, this would connect to your AI service.`;
        await addMessage(aiResponse, 'ai');
        setIsSending(false);
      }, 1000);
      
    } catch (err) {
      console.error('Error sending message:', err);
      setIsSending(false);
    }
  };

  return {
    messages,
    loading,
    error,
    isSending,
    sendMessage
  };
};
