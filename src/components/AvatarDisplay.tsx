import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

interface AvatarDisplayProps {
  avatarUrl?: string;
  isGenerating?: boolean;
  isSpeaking?: boolean;
  className?: string;
}

const AvatarDisplay = ({
  avatarUrl,
  isGenerating,
  isSpeaking,
  className = "",
}: AvatarDisplayProps) => {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => {
        setPulseScale((prev) => (prev === 1 ? 1.05 : 1));
      }, 500);
      return () => clearInterval(interval);
    } else {
      setPulseScale(1);
    }
  }, [isSpeaking]);

  if (isGenerating) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <Skeleton className="w-32 h-32 rounded-full" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Creating your avatar...
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className="relative transition-transform duration-300"
        style={{ transform: `scale(${pulseScale})` }}
      >
        <Avatar className="w-32 h-32 border-4 border-primary/20">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt="Your avatar" />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-4xl">
              👤
            </AvatarFallback>
          )}
        </Avatar>
        {isSpeaking && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <span className="text-lg">💬</span>
          </div>
        )}
      </div>
      {isSpeaking && (
        <p className="text-xs text-muted-foreground animate-pulse">
          Speaking...
        </p>
      )}
    </div>
  );
};

export default AvatarDisplay;
