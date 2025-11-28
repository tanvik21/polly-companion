import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Heart } from "lucide-react";
import AvatarSetup from "@/components/AvatarSetup";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"welcome" | "avatar">("welcome");
  const [sessionId] = useState(() => crypto.randomUUID());

  const handleAvatarCreated = (avatarUrl: string) => {
    // Store session and avatar in localStorage for now
    localStorage.setItem("polyheal_session", sessionId);
    localStorage.setItem("polyheal_avatar", avatarUrl);
    navigate("/chat");
  };

  if (step === "avatar") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AvatarSetup
          sessionId={sessionId}
          onAvatarCreated={handleAvatarCreated}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl">Welcome to PolyHeal</CardTitle>
          <CardDescription className="text-base">
            Your safe, judgment-free space to talk about any health concern
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Completely Anonymous</h3>
                <p className="text-sm text-muted-foreground">
                  No login required. Your conversations are private and
                  confidential.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Lock className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Safe & Supportive</h3>
                <p className="text-sm text-muted-foreground">
                  Talk about embarrassing moments, intimate infections, digestive
                  issues, or any health topic without judgment.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <Heart className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Your Avatar Companion</h3>
                <p className="text-sm text-muted-foreground">
                  We'll create a personalized avatar that looks like you but
                  speaks with confidence and compassion to help normalize your
                  concerns.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm">Important Notice</h4>
            <p className="text-xs text-muted-foreground">
              PolyHeal provides educational information only and is not a
              substitute for professional medical advice. If you're experiencing
              an emergency, please seek immediate medical care or call emergency
              services.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                localStorage.setItem("polyheal_session", sessionId);
                navigate("/chat");
              }}
            >
              Skip Avatar Setup
            </Button>
            <Button className="flex-1" onClick={() => setStep("avatar")}>
              Create My Avatar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
