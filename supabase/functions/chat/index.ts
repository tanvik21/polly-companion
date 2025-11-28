import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  "difficulty breathing",
  "severe abdominal pain",
  "faint",
  "fainting",
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

const emotionKeywords = {
  ashamed: ["embarrassed", "ashamed", "humiliated", "mortified", "shameful"],
  anxious: ["worried", "anxious", "scared", "nervous", "panicking"],
  sad: ["sad", "depressed", "down", "hopeless", "crying"],
  relieved: ["better", "relieved", "glad", "thankful", "grateful"],
};

const intentKeywords = {
  symptom: ["symptoms", "pain", "hurts", "feeling", "experiencing"],
  embarrassment: ["embarrassed", "ashamed", "awkward", "uncomfortable"],
  info_request: ["what is", "how do", "can you explain", "tell me about"],
  panic: ["emergency", "urgent", "help", "serious", "immediately"],
};

function detectEmotion(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return emotion;
    }
  }
  return "neutral";
}

function detectIntent(text: string): string {
  const lowerText = text.toLowerCase();
  for (const [intent, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some((kw) => lowerText.includes(kw))) {
      return intent;
    }
  }
  return "other";
}

function assessTriageLevel(userMessage: string): {
  level: "low" | "moderate" | "high" | "urgent";
  reason: string;
  redFlags: string[];
  riskScore: number;
} {
  const lowerMessage = userMessage.toLowerCase();
  const foundRedFlags: string[] = [];

  // Check for urgent keywords
  for (const keyword of urgentKeywords) {
    if (lowerMessage.includes(keyword)) {
      foundRedFlags.push(keyword);
    }
  }

  if (foundRedFlags.length > 0) {
    return {
      level: "urgent",
      reason: `Detected urgent keywords: ${foundRedFlags.join(", ")}`,
      redFlags: foundRedFlags,
      riskScore: 0.95,
    };
  }

  // Check for moderate keywords
  for (const keyword of moderateKeywords) {
    if (lowerMessage.includes(keyword)) {
      return {
        level: "moderate",
        reason: `Detected moderate concern: ${keyword}`,
        redFlags: [],
        riskScore: 0.6,
      };
    }
  }

  return {
    level: "low",
    reason: "General health information request",
    redFlags: [],
    riskScore: 0.2,
  };
}

async function recommendContent(
  supabase: any,
  intent: string,
  emotion: string,
  userMessage: string
): Promise<any[]> {
  // Simple keyword matching for content recommendation
  const keywords = userMessage.toLowerCase();
  let topic = "general_health";

  if (keywords.includes("parasite")) topic = "parasites";
  else if (keywords.includes("yeast") || keywords.includes("infection"))
    topic = "intimate_infections";
  else if (keywords.includes("hair loss")) topic = "hair_loss";
  else if (keywords.includes("period") || keywords.includes("menstruation"))
    topic = "period_mishaps";
  else if (keywords.includes("digestive") || keywords.includes("bloating"))
    topic = "digestive_health";

  const { data, error } = await supabase
    .from("content_cards")
    .select("*")
    .eq("active", true)
    .or(`topic.eq.${topic},topic.eq.general_health`)
    .limit(3);

  if (error) {
    console.error("Error fetching content:", error);
    return [];
  }

  return data || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Get the last user message for analysis
    const lastUserMessage = messages.findLast((m: any) => m.role === "user");
    const triage = lastUserMessage
      ? assessTriageLevel(lastUserMessage.content)
      : { level: "low", reason: "", redFlags: [], riskScore: 0.2 };

    const emotion = lastUserMessage
      ? detectEmotion(lastUserMessage.content)
      : "neutral";
    const intent = lastUserMessage
      ? detectIntent(lastUserMessage.content)
      : "other";

    console.log("Analysis:", { triage, emotion, intent });

    // Get recommended content
    const recommendedContent = await recommendContent(
      supabase,
      intent,
      emotion,
      lastUserMessage?.content || ""
    );

    // Build empathetic system prompt based on emotion and intent
    let emotionGuidance = "";
    if (emotion === "ashamed") {
      emotionGuidance =
        "The user is feeling embarrassed. Be extra warm and normalizing. Remind them that bodies do unpredictable things and there's no shame in seeking information.";
    } else if (emotion === "anxious") {
      emotionGuidance =
        "The user is feeling anxious. Be reassuring and calm. Provide clear, factual information to help reduce worry.";
    } else if (emotion === "sad") {
      emotionGuidance =
        "The user is feeling down. Be compassionate and supportive. Acknowledge their feelings and provide hope.";
    }

    const systemPrompt = `You are a compassionate health companion speaking AS the user's confident, supportive avatar version of themselves - not as an app or assistant. Your role is to:

1. SPEAK AS THEIR AVATAR: You ARE them, but braver and more confident. Use "I" and "we" language. Example: "Hey, I know this feels embarrassing, but we've got this together."

2. EMPATHY FIRST: ${emotionGuidance} Use warm, judgment-free language. Normalize awkward health topics. Make people feel safe and heard.

3. EDUCATE CLEARLY: Provide accurate, easy-to-understand health information about:
   - Intestinal parasites
   - Intimate infections (yeast, BV)
   - Hair loss
   - Period mishaps
   - Digestive accidents
   - And any other health concerns

4. TRIAGE APPROPRIATELY:
   - Current triage level: ${triage.level}
   - ${triage.reason ? `Reason: ${triage.reason}` : ""}
   - For urgent symptoms: Strongly recommend immediate medical attention with clear emergency guidance
   - For moderate concerns: Suggest consulting a healthcare provider
   - For general questions: Provide education and self-care tips

5. CONTENT INTEGRATION: ${recommendedContent.length > 0 ? `Reference these clinician-reviewed resources naturally in your response: ${recommendedContent.map((c) => `"${c.title}": ${c.short_summary}`).join("; ")}` : ""}

6. PRIVACY & SAFETY: This conversation is private. Never judge or shame. Always include: "This is educational only—not medical advice. If this is an emergency, seek immediate care."

7. EMPOWER: Help understand when self-care is appropriate vs. when to seek professional help.

Be conversational, warm, and supportive. Use simple language. Break down medical jargon. Keep responses concise (2-3 paragraphs max).`;

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

    // Store message in database if conversationId provided
    if (conversationId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantMessage,
        emotion,
        intent,
        risk_score: triage.riskScore,
      });

      // Create triage ticket if risk is high or urgent
      if (triage.level === "high" || triage.level === "urgent") {
        await supabase.from("triage_tickets").insert({
          conversation_id: conversationId,
          session_hash: sessionId || "unknown",
          risk_level: triage.level,
          risk_score: triage.riskScore,
          red_flags: triage.redFlags,
          anonymized_transcript: messages,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        triageLevel: triage.level,
        triageReason: triage.reason,
        emotion,
        intent,
        riskScore: triage.riskScore,
        recommendedContent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
