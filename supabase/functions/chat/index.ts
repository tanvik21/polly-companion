import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Red flag keywords for urgent triage
const urgentKeywords = [
  "suicide",
  "kill myself",
  "end my life",
  "severe pain",
  "can't breathe",
  "chest pain",
  "bleeding heavily",
  "unconscious",
  "overdose",
  "allergic reaction",
  "swelling throat",
];

const moderateKeywords = [
  "persistent",
  "weeks",
  "months",
  "getting worse",
  "fever",
  "blood",
  "infection",
  "severe",
];

function assessTriageLevel(userMessage: string): {
  level: "low" | "moderate" | "urgent";
  reason: string;
} {
  const lowerMessage = userMessage.toLowerCase();

  // Check for urgent keywords
  for (const keyword of urgentKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        level: "urgent",
        reason: `Detected urgent keyword: ${keyword}`,
      };
    }
  }

  // Check for moderate keywords
  for (const keyword of moderateKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        level: "moderate",
        reason: `Detected moderate concern: ${keyword}`,
      };
    }
  }

  return { level: "low", reason: "General health information request" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get the last user message for triage assessment
    const lastUserMessage = messages.findLast((m: any) => m.role === "user");
    const triage = lastUserMessage
      ? assessTriageLevel(lastUserMessage.content)
      : { level: "low", reason: "" };

    console.log("Triage assessment:", triage);

    // System prompt with empathetic, judgment-free tone
    const systemPrompt = `You are a compassionate health companion for the Polpharma Companion app. Your role is to:

1. EMPATHY FIRST: Use warm, judgment-free language. Normalize awkward health topics. Make people feel safe and heard.

2. EDUCATE CLEARLY: Provide accurate, easy-to-understand health information about:
   - Intestinal parasites
   - Intimate infections (yeast, BV)
   - Hair loss
   - Period mishaps
   - Digestive accidents
   - And any other health concerns

3. TRIAGE APPROPRIATELY:
   - For urgent symptoms (severe pain, difficulty breathing, suicidal thoughts): Strongly recommend immediate medical attention
   - For moderate concerns (persistent symptoms, infections, ongoing issues): Suggest consulting a healthcare provider
   - For general questions: Provide education and self-care tips

4. PRIVACY & SAFETY: Remind users their conversation is private. Never judge or shame.

5. EMPOWER: Help users understand when self-care is appropriate vs. when to seek professional help.

Current triage level: ${triage.level}
${triage.reason ? `Reason: ${triage.reason}` : ""}

Be conversational, warm, and supportive. Use simple language. Break down medical jargon.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: 0.8,
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        triageLevel: triage.level,
        triageReason: triage.reason,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
