import { MessageCircle, Shield, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HealthCard from "@/components/HealthCard";
import { healthTopics } from "@/data/healthTopics";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground animate-in fade-in slide-in-from-bottom-4 duration-700">
              Your Health Companion
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground animate-in fade-in slide-in-from-bottom-5 duration-700 delay-100">
              Empathetic, judgment-free support for questions about intimate health, 
              digestive concerns, and everything in between. You deserve care and information—no shame, no stigma.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/chat")}
              className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-primary to-warm-glow hover:opacity-90 transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start a Conversation
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="text-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Private & Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your conversations are confidential and protected
              </p>
            </div>
            <div className="text-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <div className="inline-flex p-4 rounded-full bg-safe-green/20 mb-4">
                <Heart className="w-8 h-8 text-safe-green" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Judgment-Free</h3>
              <p className="text-sm text-muted-foreground">
                No shame, no stigma—just supportive guidance
              </p>
            </div>
            <div className="text-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              <div className="inline-flex p-4 rounded-full bg-accent/20 mb-4">
                <MessageCircle className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Expert Guidance</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered triage and reliable health information
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Health Topics Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Health Topics We Cover
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Click any topic to start a conversation, or ask about anything else on your mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthTopics.map((topic, index) => (
              <div
                key={topic.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <HealthCard
                  topic={topic}
                  onClick={() => navigate("/chat")}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
        <div className="container mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-3xl font-bold text-foreground">
            Ready to Get Support?
          </h2>
          <p className="text-lg text-muted-foreground">
            Start a confidential conversation about any health concern. 
            We're here to help you feel informed and empowered.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/chat")}
            className="rounded-full px-8 py-6 text-lg bg-gradient-to-r from-primary to-warm-glow hover:opacity-90 transition-all duration-300 hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
