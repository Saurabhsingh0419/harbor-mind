// src/components/AIChatScreen.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, Mic } from "lucide-react";
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
  const { messages, loading, error } = useRealtimeChat();
  
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false); 
  
  const contentRef = useRef<HTMLDivElement>(null); // Renamed ref
  
  const synth = useRef(window.speechSynthesis);

  // --- NEW: useEffect to find and log available voices (Removed logs) ---
  useEffect(() => {
    const loadVoices = () => {
      // Just ensure voices are loaded
      synth.current.getVoices();
    };
    synth.current.onvoiceschanged = loadVoices;
    loadVoices();
  }, [synth]);
  // --- END NEW useEffect ---

  // --- MODIFIED: Auto-scroll to bottom ---
  useEffect(() => {
    // We check the ref for the *content* div
    if (contentRef.current) {
      // The actual scrolling element is the *parent* of our content div,
      // which is the <ScrollAreaPrimitive.Viewport>
      const viewport = contentRef.current.parentElement; 
      
      if (viewport) {
        // Use a 0ms timeout to wait for the DOM to render the new messages
        // before calculating the scrollHeight
        setTimeout(() => {
          viewport.scrollTop = viewport.scrollHeight;
        }, 0);
      }
    }
    // Rerun this effect whenever 'messages' array changes (new message)
    // or when 'loading' changes (initial load finishes)
  }, [messages, loading]);
  // --- END MODIFIED ---


  // 🎙️ Speech-to-text (Unchanged)
  const startListening = () => {
    const globalWindow = window as unknown as BrowserSpeech;
    const SpeechRecognition = globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onstart = () => {
      setIsSending(true); 
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = (e && e.results && e.results[0] && e.results[0][0] && e.results[0][0].transcript) || '';
      setInputValue(transcript);
      setIsSending(false); 
      handleSendMessage(transcript);
    };
    recognition.onend = () => {
      setIsSending(false); 
    };
    recognition.start();
  };
  
  // 🔥 MODIFIED: This function now calls our API (Unchanged from your version)
  const handleSendMessage = async (messageText?: string) => {
    const textToSend = (messageText || inputValue).trim();
    
    if (!textToSend || isSending || !user) return;

    setIsSending(true);
    setInputValue(''); // Clear input immediately
    
    try {
      const token = await user.getIdToken();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) {
        throw new Error("API request failed");
      }

      const data = await res.json();
      
      // 1. Clean the reply to remove asterisks
      const cleanReply = data.reply.replace(/\*/g, '');

      // 2. Use the clean reply for the speech
      const utter = new SpeechSynthesisUtterance(cleanReply);

      // 3. Find and set a better, more natural voice
      const voices = synth.current.getVoices();
      
      let selectedVoice = voices.find(voice => voice.name === "Google UK English Female"); 
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.name === "Microsoft Heera - English (India)");
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.name === "Google US English");
      }

      if (selectedVoice) {
        utter.voice = selectedVoice;
        console.log(`Using voice: ${selectedVoice.name}`);
      }
      
      utter.pitch = 1;
      utter.rate = 0.9; // Slower pace
      synth.current.speak(utter);

    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending && inputValue.trim()) {
      handleSendMessage();
    }
  };

  // --- Timestamp formatting (Unchanged) ---
  const isTimestampLike = (v: unknown): v is { toDate: () => Date } => {
    return (
      typeof v === 'object' &&
      v !== null &&
      'toDate' in v &&
      typeof (v as { toDate?: unknown }).toDate === 'function'
    );
  };
  const toDate = (t?: { toDate?: () => Date } | string | number | Date): Date => {
    if (!t) return new Date(NaN);
    if (isTimestampLike(t)) return t.toDate();
    return new Date(t as string | number | Date);
  };
  const formatTimestamp = (timestamp?: { toDate?: () => Date } | string | number | Date) => {
    const date = toDate(timestamp);
    if (isNaN(date.getTime())) return "Sending..."; 
    return date.toLocaleTimeString('en-US', {  
      hour: 'numeric',  
      minute: '2-digit'  
    });
  };
  // --- End Timestamp formatting ---

  // --- JSX (Unchanged) ---
  return (
    <div className="flex flex-col h-screen bg-background">
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

      <div className="px-6 py-2 bg-blue-50 border-b border-blue-200">
        <p className="text-sm text-blue-800">
          This AI is not a substitute for professional help. If you're in crisis, please call 988 (Suicide & Crisis Lifeline).
        </p>
      </div>

      {error && (
        <div className="px-6 py-2 bg-destructive/10 border-b border-destructive/20">
          <p className="text-destructive text-sm">Error: {error}</p>
        </div>
      )}

      {loading && (
        <div className="px-6 py-2 bg-muted/50 border-b">
          <p className="text-muted-foreground text-sm">Loading messages...</p>
        </div>
      )}

      {/* --- MODIFIED: Renamed ref to 'contentRef' --- */}
      <ScrollArea className="flex-1">
        <div ref={contentRef} className="px-6 py-4 space-y-4">
          {messages.length === 0 && !loading && ( 
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
          {isSending && !inputValue && (
             <div className="text-center text-muted-foreground text-sm">Thinking...</div>
          )}
        </div>
      </ScrollArea>

      <div className="px-6 py-4 border-t bg-white/70 backdrop-blur-md">
        <div className="flex gap-2">
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
            onClick={() => handleSendMessage()} 
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