// src/components/AIChatScreen.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Mic } from "lucide-react"; // NEW: Added Microphone
import { useRealtimeChat } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import type { ChatMessage as BaseChatMessage } from '@/services/firestoreService';

// Extend ChatMessage locally to include optional mood field returned by AI
type ChatMessage = BaseChatMessage & { mood?: string };

// Local typing for browser speech APIs to avoid `any`
type BrowserSpeech = {
  SpeechRecognition?: new () => {
    lang: string;
    onstart: () => void;
    onresult: (e: unknown) => void; // results typing is complex across browsers
    onend: () => void;
    start: () => void;
  };
  webkitSpeechRecognition?: new () => {
    lang: string;
    onstart: () => void;
    onresult: (e: unknown) => void;
    onend: () => void;
    start: () => void;
  };
};

const AIChatScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  // ✅ KEPT: Your real-time hook still does all the hard work of displaying messages!
  const { messages, loading, error } = useRealtimeChat();
  
  // NEW: Local state for input and sending status
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false); // NEW: Local sending state
  
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  
  // NEW: Ref for text-to-speech
  const synth = useRef(window.speechSynthesis);

  // Hooks are declared above. We'll still show loading/unauthenticated UI, but after hooks run.

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaViewportRef.current) {
      setTimeout(() => {
        if (scrollAreaViewportRef.current) {
          scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages]);

  // 🎙️ NEW: Speech-to-text
  const startListening = () => {
    // Provide a safer typing for window SpeechRecognition variants
  const globalWindow = window as unknown as BrowserSpeech;
  const SpeechRecognition = globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => {
      setIsSending(true); // Visually indicate we're listening
    };
    // results typing differs between browsers; allow any locally with a clear eslint exception
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      // e.results typing may be platform-specific; access cautiously
      const transcript = (e && e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript) || '';
      setInputValue(transcript);
      setIsSending(false); // We have the result
      // Automatically send after speech
      handleSendMessage(transcript);
    };
    recognition.onend = () => {
      setIsSending(false); // Stop listening
    };
    recognition.start();
  };
  
  // 🔥 MODIFIED: This function now calls our API
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = (messageText || inputValue).trim();
    
    if (!textToSend || isSending || !user) return;

    setIsSending(true);
    setInputValue(''); // Clear input immediately
    
    try {
      // Get the user's auth token to send to the API
      const token = await user.getIdToken();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // Send the secure token
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data = await res.json();
      
      // 🔊 NEW: Text-to-Speech
      const utter = new SpeechSynthesisUtterance(data.reply);
      utter.pitch = 1;
      utter.rate = 1;
      synth.current.speak(utter);

    } catch (err) {
      console.error("Error sending message:", err);
      // (Optional: You could write a local error message back to the chat)
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending && inputValue.trim()) {
      handleSendMessage();
    }
  };

  const isTimestampLike = (v: unknown): v is { toDate: () => Date } => {
    return typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as any).toDate === 'function';
  };

  const toDate = (t?: { toDate?: () => Date } | string | number | Date): Date => {
    if (!t) return new Date(NaN);
    if (isTimestampLike(t)) return t.toDate();
    return new Date(t as string | number | Date);
  };

  const formatTimestamp = (timestamp?: { toDate?: () => Date } | string | number | Date) => {
    // Handle both Date objects and Firestore Timestamps
    const date = toDate(timestamp);
    if (isNaN(date.getTime())) return "Sending..."; // Handle pending timestamp
    return date.toLocaleTimeString('en-US', {  
      hour: 'numeric',  
      minute: '2-digit'  
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header (No changes) */}
      <header className="flex items-center gap-4 px-6 py-4 border-b bg-white/70 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-foreground">AI Companion</h1>
          <p className="text-sm text-muted-foreground">Your supportive AI friend</p>
        </div>
      </header>

      {/* Crisis Warning (No changes) */}
      <div className="px-6 py-2 bg-blue-50 border-b border-blue-200">
        <p className="text-sm text-blue-800">
          This AI is not a substitute for professional help. If you're in crisis, please call 988 (Suicide & Crisis Lifeline).
        </p>
      </div>

      {/* Error Display (No changes) */}
      {error && (
        <div className="px-6 py-2 bg-destructive/10 border-b border-destructive/20">
          <p className="text-destructive text-sm">Error: {error}</p>
        </div>
      )}

      {/* Loading State (No changes) */}
      {loading && (
        <div className="px-6 py-2 bg-muted/50 border-b">
          <p className="text-muted-foreground text-sm">Loading messages...</p>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div ref={scrollAreaViewportRef} className="px-6 py-4 space-y-4">
          {messages.length === 0 && !loading && ( // Modified condition
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation with your AI companion</p>
              <p className="text-xs mt-2 text-muted-foreground/70">Your messages are now saved to Firestore</p>
            </div>
          )}
          {messages.map((message: ChatMessage) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/70 backdrop-blur-md border text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                {/* ✅ NEW: Show mood if it exists */}
                {message.sender === 'ai' && message.mood && (
                  <p className="text-xs italic opacity-70 mt-1">
                    (Mood: {message.mood})
                  </p>
                )}
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground'
                }`}>
                  {formatTimestamp(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {/* NEW: Show thinking... for API call */}
          {isSending && !inputValue && (
             <div className="text-center text-muted-foreground text-sm">Thinking...</div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-6 py-4 border-t bg-white/70 backdrop-blur-md">
        <div className="flex gap-2">
          {/* 🎙️ NEW: Mic Button */}
          <Button
  onClick={startListening}
  disabled={isSending}
  variant="ghost"
  size="icon"
>
  <Mic className="h-4 w-4" />
</Button>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type or speak..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()} // Modified
            disabled={isSending || !inputValue.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatScreen;