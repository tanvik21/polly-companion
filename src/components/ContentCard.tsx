import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { CheckCircle2 } from "lucide-react";

interface ContentCardProps {
  title: string;
  summary: string;
  tags?: string[];
  clinicianReviewed?: boolean;
  clinicianSignedBy?: string;
}

const ContentCard = ({
  title,
  summary,
  tags = [],
  clinicianReviewed,
  clinicianSignedBy,
}: ContentCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {clinicianReviewed && (
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
          )}
        </div>
        <CardDescription className="text-sm">{summary}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        {clinicianSignedBy && (
          <p className="text-xs text-muted-foreground mt-2">
            Reviewed by {clinicianSignedBy}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentCard;
