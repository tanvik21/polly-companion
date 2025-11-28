import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, sessionId, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!description || !sessionId) {
      throw new Error("Description and sessionId are required");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Enhanced prompt for friendly, expressive cartoon avatar
    const avatarPrompt = `Create a friendly, expressive cartoon avatar based on this description: ${description}. 
    Style: warm, approachable, non-uncanny, modern illustration style with clean lines. 
    The avatar should look confident, empathetic, and supportive - like a caring friend. 
    Features: ${description}. 
    Expression: gentle smile, kind eyes, approachable demeanor.
    Background: soft gradient or solid friendly color.
    Art style: similar to modern health app illustrations - clean, friendly, professional but warm.`;

    console.log("Generating avatar with prompt:", avatarPrompt);

    // Use Gemini Nano Banana for image generation
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: avatarPrompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    console.log("Avatar generated successfully");

    // Store avatar in database
    const { data: avatarData, error: dbError } = await supabase
      .from("avatars")
      .insert({
        user_id: userId || null,
        session_id: sessionId,
        avatar_url: imageUrl,
        selfie_description: description,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw dbError;
    }

    return new Response(
      JSON.stringify({
        avatarUrl: imageUrl,
        avatarId: avatarData.id,
        message: "Avatar generated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Avatar generation error:", error);
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
