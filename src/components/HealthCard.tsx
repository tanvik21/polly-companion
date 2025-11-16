import { Card } from "@/components/ui/card";
import { HealthTopic } from "@/data/healthTopics";

interface HealthCardProps {
  topic: HealthTopic;
  onClick?: () => void;
}

const HealthCard = ({ topic, onClick }: HealthCardProps) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "intimate":
        return "from-gentle-purple/20 to-accent/30";
      case "digestive":
        return "from-safe-green/20 to-secondary/30";
      case "common":
        return "from-primary/20 to-warm-glow/30";
      default:
        return "from-muted to-muted/50";
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-border/50 bg-gradient-to-br ${getCategoryColor(
        topic.category
      )} backdrop-blur-sm`}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl" role="img" aria-label={topic.title}>
          {topic.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2 text-foreground">
            {topic.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {topic.description}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default HealthCard;
