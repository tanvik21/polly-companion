export interface HealthTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "common" | "intimate" | "digestive" | "other";
  keywords: string[];
}

export const healthTopics: HealthTopic[] = [
  {
    id: "parasites",
    title: "Intestinal Parasites",
    description: "Understanding common parasites, symptoms, and when to seek care. You're not alone—these are more common than you think.",
    icon: "🦠",
    category: "digestive",
    keywords: ["worms", "parasites", "intestinal", "stomach", "digestive"],
  },
  {
    id: "yeast-infection",
    title: "Yeast Infections",
    description: "Practical info about vaginal yeast infections—causes, symptoms, and treatment options explained simply.",
    icon: "🌸",
    category: "intimate",
    keywords: ["yeast", "infection", "vaginal", "intimate", "candida"],
  },
  {
    id: "bv",
    title: "Bacterial Vaginosis",
    description: "Learn about BV symptoms and treatment. It's treatable and nothing to be embarrassed about.",
    icon: "💐",
    category: "intimate",
    keywords: ["bacterial", "vaginosis", "bv", "vaginal", "discharge"],
  },
  {
    id: "hair-loss",
    title: "Hair Loss Support",
    description: "Explore causes of hair loss and when to talk to a doctor. There are many options available.",
    icon: "🌿",
    category: "other",
    keywords: ["hair", "loss", "thinning", "scalp", "alopecia"],
  },
  {
    id: "period-mishaps",
    title: "Period Mishaps",
    description: "Managing unexpected period situations with confidence. Tips, products, and when to see a doctor.",
    icon: "🌺",
    category: "common",
    keywords: ["period", "menstruation", "mishap", "leak", "emergency"],
  },
  {
    id: "digestive-accidents",
    title: "Digestive Accidents",
    description: "Practical guidance for managing urgent digestive issues. Everyone experiences this—let's talk solutions.",
    icon: "🍃",
    category: "digestive",
    keywords: ["digestive", "accident", "urgency", "bowel", "diarrhea"],
  },
];
