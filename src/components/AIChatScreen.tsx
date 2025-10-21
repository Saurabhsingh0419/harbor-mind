import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  CollectionReference
} from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { useAuth } from "@/context/AuthContext";

interface Message {
  id?: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Timestamp | null;
  userId: string;
}

const AIChatScreen = () => {
  const navigate = useNavigate();
  const { userId, authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollAreaViewportRef.current) {
        scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Message Listener
  useEffect(() => {
    if (!userId) return;

    try {
      const messagesRef = collection(db, `chats/${userId}/messages`) as CollectionReference<DocumentData>;
      const q = query(messagesRef, orderBy('timestamp'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        try {
          const fetchedMessages: Message[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return {
              id: doc.id,
              sender: data.sender || 'user',
              text: data.text || '',
              timestamp: data.timestamp instanceof Timestamp ? data.timestamp : null,
              userId: data.userId || userId,
            } as Message;
          });
          setMessages(fetchedMessages);
        } catch (error) {
          console.error("Error processing messages:", error);
        }
      }, (error) => {
        console.error("Error listening to messages:", error);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up message listener:", error);
    }
  }, [userId]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending && inputValue.trim()) {
      handleSendMessage();
    }
  };

  // Send message
  const handleSendMessage = async () => {
    const userMessageText = inputValue.trim();
    
    if (!userMessageText || !userId || isSending) return;

    setIsSending(true);
    const currentInput = inputValue;
    setInputValue('');

    try {
      const messageData = {
        sender: 'user',
        text: userMessageText,
        userId: userId,
        timestamp: serverTimestamp()
      };

      const messagesRef = collection(db, `chats/${userId}/messages`);
      await addDoc(messagesRef, messageData);
    } catch (error) {
      console.error("Error sending message:", error);
      setInputValue(currentInput);
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    try {
      return timestamp.toDate().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Missing userId state
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-muted-foreground">Authentication required</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b bg-white/70 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold text-foreground">AI Companion</h1>
      </header>

      {/* Disclaimer */}
      <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
        <p className="text-sm text-blue-800">
          This AI is not a substitute for professional help. If you're in crisis, please call 988 (Suicide & Crisis Lifeline).
        </p>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div ref={scrollAreaViewportRef} className="px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation with your AI companion</p>
            </div>
          )}
          {messages.map((message) => (
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
                {message.timestamp && (
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-6 py-4 border-t bg-white/70 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
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
