import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";
import AvatarDisplay from "./AvatarDisplay";
import ContentCard from "./ContentCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  emotion?: string;
  intent?: string;
}

interface RecommendedContent {
  id: string;
  title: string;
  short_summary: string;
  tags: string[];
  clinician_reviewed: boolean;
  clinician_signed_by: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your confident, supportive self - here to help you navigate any health question without judgment. Whether it's about intimate health, digestive concerns, or anything else—we've got this together. What's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recommendedContent, setRecommendedContent] = useState<RecommendedContent[]>([]);
  const [sessionId] = useState(() => localStorage.getItem("polyheal_session") || crypto.randomUUID());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [avatarUrl] = useState(() => localStorage.getItem("polyheal_avatar") || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create conversation in database
    const createConversation = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          session_id: sessionId,
          user_id: null, // Anonymous
          is_anonymous: true,
        })
        .select()
        .single();

      if (!error && data) {
        setConversationId(data.id);
      }
    };

    createConversation();
  }, [sessionId]);

  useEffect(() => {
    if (isLoading) {
      setIsSpeaking(true);
    } else {
      const timer = setTimeout(() => setIsSpeaking(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    const newUserMsg: Message = { role: "user", content: userMessage };
    setMessages((prev) => [...prev, newUserMsg]);
    
    // Store user message in database
    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: userMessage,
      });
    }
    
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat", {
        body: {
          messages: [...messages, newUserMsg],
          sessionId,
          conversationId,
        },
      });

      if (error) throw error;

      if (data?.message) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message,
            emotion: data.emotion,
            intent: data.intent,
          },
        ]);

        // Set recommended content
        if (data.recommendedContent && data.recommendedContent.length > 0) {
          setRecommendedContent(data.recommendedContent);
        }

        // Show triage notification if needed
        if (data.triageLevel === "urgent") {
          toast({
            title: "⚠️ Please Seek Immediate Medical Attention",
            description:
              "Based on your symptoms, we strongly recommend seeking emergency care immediately.",
            variant: "destructive",
          });
        } else if (data.triageLevel === "high") {
          toast({
            title: "🩺 Please See a Healthcare Provider Soon",
            description:
              "Your symptoms warrant professional medical evaluation.",
            variant: "destructive",
          });
        } else if (data.triageLevel === "moderate") {
          toast({
            title: "💭 Consider Consulting a Doctor",
            description:
              "Your symptoms may benefit from professional medical advice.",
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Connection Error",
        description: "Unable to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Avatar at top */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4 flex justify-center">
        <AvatarDisplay
          avatarUrl={avatarUrl}
          isSpeaking={isSpeaking}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} role={message.role} content={message.content} />
        ))}
        
        {/* Show loading indicator */}
        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="bg-card border-2 border-border rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Show recommended content */}
        {recommendedContent.length > 0 && !isLoading && (
          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-semibold text-muted-foreground">
              📚 Related Resources
            </h3>
            {recommendedContent.map((content) => (
              <ContentCard
                key={content.id}
                title={content.title}
                summary={content.short_summary}
                tags={content.tags}
                clinicianReviewed={content.clinician_reviewed}
                clinicianSignedBy={content.clinician_signed_by}
              />
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send)"
            className="min-h-[60px] max-h-[120px] resize-none rounded-2xl"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="rounded-full px-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🔒 Your conversations are private and secure • Educational only - not medical advice
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
