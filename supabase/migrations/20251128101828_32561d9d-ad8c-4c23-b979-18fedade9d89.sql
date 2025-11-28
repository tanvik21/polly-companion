-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_style TEXT DEFAULT 'friendly',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create avatars table to store generated avatar images
CREATE TABLE public.avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  selfie_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL UNIQUE,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table for conversation history
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  emotion TEXT,
  intent TEXT,
  risk_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create triage_tickets table for clinician escalation
CREATE TABLE public.triage_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  session_hash TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'urgent')),
  risk_score DECIMAL(3,2),
  red_flags TEXT[],
  anonymized_transcript JSONB,
  clinician_notes TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create content_cards table for educational health content
CREATE TABLE public.content_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  short_summary TEXT,
  tags TEXT[],
  topic TEXT NOT NULL,
  clinician_reviewed BOOLEAN DEFAULT false,
  clinician_signed_by TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create mood_tracking table
CREATE TABLE public.mood_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_tracking ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Avatars policies (allow anonymous access via session_id)
CREATE POLICY "Users can view avatars by session"
  ON public.avatars FOR SELECT
  USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert avatars"
  ON public.avatars FOR INSERT
  WITH CHECK (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Conversations policies (support anonymous mode)
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_id IS NULL OR conversations.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
      AND (conversations.user_id IS NULL OR conversations.user_id = auth.uid())
    )
  );

-- Triage tickets policies (clinicians need special access)
CREATE POLICY "Clinicians can view all tickets"
  ON public.triage_tickets FOR SELECT
  USING (true);

CREATE POLICY "System can create tickets"
  ON public.triage_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Clinicians can update tickets"
  ON public.triage_tickets FOR UPDATE
  USING (true);

-- Content cards policies (public read, clinicians can manage)
CREATE POLICY "Anyone can view active content cards"
  ON public.content_cards FOR SELECT
  USING (active = true);

CREATE POLICY "Clinicians can manage content cards"
  ON public.content_cards FOR ALL
  USING (true);

-- Mood tracking policies
CREATE POLICY "Users can view their mood tracking"
  ON public.mood_tracking FOR SELECT
  USING (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

CREATE POLICY "Users can insert mood tracking"
  ON public.mood_tracking FOR INSERT
  WITH CHECK (
    user_id IS NULL OR 
    auth.uid() = user_id
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_cards_updated_at
  BEFORE UPDATE ON public.content_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample content cards
INSERT INTO public.content_cards (title, body, short_summary, tags, topic, clinician_reviewed, clinician_signed_by) VALUES
('Understanding Intestinal Parasites', 'Intestinal parasites are organisms that live in the digestive tract. Common symptoms include stomach pain, bloating, and digestive changes. Many are treatable with medication prescribed by a healthcare provider. If you suspect parasites, a simple stool test can diagnose the issue.', 'Learn about common intestinal parasites, symptoms, and treatment options.', ARRAY['parasites', 'digestive', 'infection'], 'parasites', true, 'Dr. Sarah Johnson, MD'),
('Yeast Infections: What You Need to Know', 'Yeast infections are common fungal infections that cause itching, discharge, and discomfort. They''re not sexually transmitted and can be triggered by antibiotics, hormones, or tight clothing. Over-the-counter treatments are available, but see a provider if symptoms persist.', 'Common, treatable fungal infection with simple remedies available.', ARRAY['intimate health', 'yeast', 'infection'], 'intimate_infections', true, 'Dr. Sarah Johnson, MD'),
('Bacterial Vaginosis (BV) Explained', 'BV is caused by an imbalance of natural bacteria in the vagina. Symptoms include unusual discharge and odor. It''s not an STI but can increase infection risk if untreated. Prescription antibiotics effectively treat BV. No need to feel embarrassed—it''s very common.', 'Bacterial imbalance causing discharge and odor; easily treated with antibiotics.', ARRAY['intimate health', 'BV', 'infection'], 'intimate_infections', true, 'Dr. Sarah Johnson, MD'),
('Hair Loss: Causes and Solutions', 'Hair loss can result from genetics, stress, hormones, nutrition, or medical conditions. Treatments range from lifestyle changes to medications and procedures. Early consultation with a dermatologist can help identify the cause and best treatment approach.', 'Multiple causes of hair loss exist with various treatment options available.', ARRAY['hair loss', 'dermatology', 'hormones'], 'hair_loss', true, 'Dr. Michael Chen, Dermatology'),
('Period Stains Happen—Here''s What to Do', 'Period leaks are completely normal and happen to everyone. Keep a backup kit (pad, wipes, spare underwear) handy. Rinse stains with cold water ASAP. Remember: menstruation is a natural body function, not something to be ashamed of.', 'Period leaks are normal; practical tips for managing unexpected moments.', ARRAY['menstruation', 'periods', 'self-care'], 'period_mishaps', true, 'Dr. Emily Rodriguez, OB-GYN'),
('Digestive Gas and Bloating', 'Gas and bloating are normal digestive processes. Triggers include certain foods, eating too fast, or swallowing air. Most cases resolve with dietary adjustments. Persistent severe bloating should be evaluated by a healthcare provider.', 'Gas and bloating are normal; learn triggers and when to seek help.', ARRAY['digestive', 'bloating', 'gas'], 'digestive_health', true, 'Dr. Sarah Johnson, MD'),
('When Digestive Accidents Happen', 'Occasional bowel accidents can happen due to illness, diet, stress, or medical conditions. If it happens once, it''s likely nothing to worry about. Frequent accidents warrant a conversation with your doctor to rule out underlying issues.', 'Occasional digestive accidents are more common than you think.', ARRAY['digestive', 'accidents', 'bowel'], 'digestive_health', true, 'Dr. Sarah Johnson, MD'),
('Talking to Your Doctor About Embarrassing Topics', 'Medical professionals see these issues daily and won''t judge you. Write down your symptoms beforehand, use clear medical terms, and remember they''re there to help. Your health matters more than temporary embarrassment.', 'Tips for discussing sensitive health topics with healthcare providers.', ARRAY['communication', 'healthcare', 'advocacy'], 'general_health', true, 'Dr. Emily Rodriguez, OB-GYN');
