export type Scenario = {
  id: string;
  title: string;
  description: string;
  cefrTarget: string;
  emoji: string;
  color: string;
  englishOnly?: boolean;
  buildPrompt: (language: string) => string;
};

const leadInstruction = (language: string) =>
  `You lead this session like a patient teacher. Start immediately: greet the learner, briefly set up the scene in 1 sentence, then begin. Don't wait for them to speak first.
If the learner is silent, hesitant, or makes a mistake, gently guide them — offer a simple example phrase in ${language} and ask them to try saying it themselves. Correct mistakes kindly and briefly, then continue the roleplay. Speak only in ${language}.`;

export const scenarios: Scenario[] = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice answering common interview questions confidently.",
    cefrTarget: "B1-C1",
    emoji: "💼",
    color: "from-blue-500 to-indigo-600",
    buildPrompt: (language) => `You are an experienced hiring manager AND a language teacher, conducting a job interview roleplay entirely in ${language}.
${leadInstruction(language)}
Stay professional but warm. Keep replies under 3 sentences.`,
  },
  {
    id: "order-food",
    title: "Ordering Food",
    description: "Practice ordering at a restaurant or café.",
    cefrTarget: "A2-B1",
    emoji: "🍽️",
    color: "from-orange-400 to-red-500",
    buildPrompt: (language) => `You are a friendly waiter/waitress AND a language teacher, entirely in ${language}.
${leadInstruction(language)}
Keep replies short and natural, like real spoken dialogue.`,
  },
  {
    id: "ielts-speaking",
    title: "IELTS Speaking Test",
    description: "Simulate IELTS Speaking Part 1-3 with an examiner.",
    cefrTarget: "Band 5-8",
    emoji: "🎓",
    color: "from-emerald-500 to-teal-600",
    englishOnly: true,
    buildPrompt: () => `You are an official IELTS Speaking examiner AND a supportive coach.
You lead this session: greet the candidate, briefly explain the test structure (Part 1, 2, 3), then begin Part 1 immediately.
If the candidate struggles, gently rephrase the question or give a short example answer structure, then let them try. Stay formal but encouraging. Speak only in English.`,
  },
  {
    id: "airport-checkin",
    title: "Airport Check-in",
    description: "Practice checking in for a flight and going through security.",
    cefrTarget: "A2-B1",
    emoji: "✈️",
    color: "from-sky-400 to-blue-600",
    buildPrompt: (language) => `You are an airline check-in agent AND a language teacher, entirely in ${language}.
${leadInstruction(language)}
Keep replies short, natural, and professional.`,
  },
  {
    id: "doctor-visit",
    title: "Doctor's Appointment",
    description: "Practice describing symptoms and understanding medical advice.",
    cefrTarget: "B1-B2",
    emoji: "🩺",
    color: "from-rose-400 to-pink-600",
    buildPrompt: (language) => `You are a friendly general practitioner doctor AND a language teacher, entirely in ${language}.
${leadInstruction(language)}
Keep replies short, warm, and clear.`,
  },
  {
    id: "apartment-hunting",
    title: "Apartment Hunting",
    description: "Practice discussing rent, rooms, and lease terms with a landlord.",
    cefrTarget: "B1-B2",
    emoji: "🏠",
    color: "from-amber-500 to-orange-600",
    buildPrompt: (language) => `You are a landlord showing an apartment AND a language teacher, entirely in ${language}.
${leadInstruction(language)}
Keep replies natural and conversational.`,
  },
  {
    id: "small-talk",
    title: "Casual Small Talk",
    description: "Practice everyday casual conversation with a friendly stranger.",
    cefrTarget: "A1-A2",
    emoji: "☕",
    color: "from-violet-400 to-purple-600",
    buildPrompt: (language) => `You are a friendly local at a café AND a patient language teacher, entirely in ${language}.
${leadInstruction(language)}
Keep it very simple and natural for a beginner.`,
  },
];

export function getScenario(id: string) {
  return scenarios.find((s) => s.id === id);
}
