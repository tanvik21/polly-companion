import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AvatarDisplay from "./AvatarDisplay";

interface AvatarSetupProps {
  sessionId: string;
  onAvatarCreated: (avatarUrl: string) => void;
}

const AvatarSetup = ({ sessionId, onAvatarCreated }: AvatarSetupProps) => {
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please describe how you'd like your avatar to look.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-avatar",
        {
          body: {
            description: description.trim(),
            sessionId,
            userId: null, // Anonymous for now
          },
        }
      );

      if (error) throw error;

      toast({
        title: "Avatar created!",
        description: "Your personalized avatar is ready to support you.",
      });

      onAvatarCreated(data.avatarUrl);
    } catch (error: any) {
      console.error("Avatar generation error:", error);
      toast({
        title: "Error creating avatar",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create Your Health Companion Avatar</CardTitle>
        <CardDescription>
          Describe yourself and we'll create a supportive avatar version of you
          - a confident friend who's here to help you navigate any health concern
          without judgment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AvatarDisplay isGenerating={isGenerating} />
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Describe your appearance
          </label>
          <Textarea
            placeholder="E.g., Short brown hair, glasses, warm smile, wearing a blue shirt..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isGenerating}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Your avatar will look like you but with a confident, supportive
            expression.
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full"
        >
          {isGenerating ? "Creating your avatar..." : "Create My Avatar"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your description is only used to generate your avatar and isn't
          shared.
        </p>
      </CardContent>
    </Card>
  );
};

export default AvatarSetup;
