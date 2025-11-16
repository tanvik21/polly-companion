import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ChatInterface from "@/components/ChatInterface";

const Chat = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Health Companion</h1>
            <p className="text-xs text-muted-foreground">
              Safe, private, judgment-free support
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto max-w-4xl flex flex-col">
        <ChatInterface />
      </main>
    </div>
  );
};

export default Chat;
