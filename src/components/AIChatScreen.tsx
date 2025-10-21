import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { useRealtimeChat } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";

const AIChatScreen = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { messages, loading, error, isSending, sendMessage } = useRealtimeChat();
  const [inputValue, setInputValue] = useState('');
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);

  // Show loading state while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Authentication required to use chat</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

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

  const handleSendMessage = async () => {
    const userMessageText = inputValue.trim();
    
    if (!userMessageText || isSending) return;

    setInputValue('');
    await sendMessage(userMessageText);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSending && inputValue.trim()) {
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: any) => {
    // Handle both Date objects and Firestore Timestamps
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

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

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2 bg-destructive/10 border-b border-destructive/20">
          <p className="text-destructive text-sm">Error: {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="px-6 py-2 bg-muted/50 border-b">
          <p className="text-muted-foreground text-sm">Loading messages...</p>
        </div>
      )}

      {/* Messages Area */}
      <ScrollArea className="flex-1">
        <div ref={scrollAreaViewportRef} className="px-6 py-4 space-y-4">
          {messages.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          <p>Start a conversation with your AI companion</p>
          <p className="text-xs mt-2 text-muted-foreground/70">Your messages are now saved to Firestore</p>
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
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="px-6 py-4 border-t bg-white/70 backdrop-blur-md">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
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
