import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface Ticket {
  id: string;
  risk_level: string;
  risk_score: number;
  red_flags: string[];
  anonymized_transcript: any;
  clinician_notes: string | null;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  session_hash: string;
}

const Clinician = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("triage_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading tickets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedTicket) return;

    try {
      const { error } = await supabase
        .from("triage_tickets")
        .update({
          resolved: true,
          clinician_notes: notes,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      toast({
        title: "Ticket resolved",
        description: "The ticket has been marked as resolved.",
      });

      setSelectedTicket(null);
      setNotes("");
      fetchTickets();
    } catch (error: any) {
      toast({
        title: "Error resolving ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "urgent":
        return "destructive";
      case "high":
        return "destructive";
      case "moderate":
        return "default";
      default:
        return "secondary";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "urgent":
      case "high":
        return <AlertCircle className="w-4 h-4" />;
      case "moderate":
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Clinician Portal</h1>
          <p className="text-muted-foreground">
            Review escalated cases and provide clinical guidance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Triage Tickets</CardTitle>
              <CardDescription>
                {tickets.filter((t) => !t.resolved).length} unresolved
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setNotes(ticket.clinician_notes || "");
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  } ${ticket.resolved ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={getRiskColor(ticket.risk_level)}>
                      {getRiskIcon(ticket.risk_level)}
                      <span className="ml-1">{ticket.risk_level}</span>
                    </Badge>
                    {ticket.resolved && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                  {ticket.red_flags.length > 0 && (
                    <p className="text-xs text-destructive mt-1">
                      Red flags: {ticket.red_flags.length}
                    </p>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Ticket Details */}
          {selectedTicket ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ticket Details</CardTitle>
                    <CardDescription>
                      Session: {selectedTicket.session_hash.slice(0, 8)}...
                    </CardDescription>
                  </div>
                  <Badge variant={getRiskColor(selectedTicket.risk_level)}>
                    {selectedTicket.risk_level} risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Risk Assessment</h3>
                  <p className="text-sm">
                    Risk Score: {(selectedTicket.risk_score * 100).toFixed(0)}%
                  </p>
                  {selectedTicket.red_flags.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-destructive mb-1">
                        Red Flags:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedTicket.red_flags.map((flag, i) => (
                          <Badge key={i} variant="destructive">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    Anonymized Conversation
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg max-h-64 overflow-y-auto space-y-2">
                    {Array.isArray(selectedTicket.anonymized_transcript) &&
                      selectedTicket.anonymized_transcript.map(
                        (msg: any, i: number) => (
                          <div key={i}>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {msg.role === "user" ? "User" : "Assistant"}
                            </p>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                        )
                      )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Clinical Notes
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your clinical assessment and recommendations..."
                    rows={4}
                    disabled={selectedTicket.resolved}
                  />
                </div>

                {!selectedTicket.resolved && (
                  <Button onClick={handleResolve} className="w-full">
                    Mark as Resolved
                  </Button>
                )}

                {selectedTicket.resolved && (
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <p className="text-sm font-medium text-primary mb-1">
                      Resolved
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(
                        selectedTicket.resolved_at || ""
                      ).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="lg:col-span-2 flex items-center justify-center">
              <p className="text-muted-foreground">
                Select a ticket to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clinician;
