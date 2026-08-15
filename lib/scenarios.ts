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

export const scenarios: Scenario[] = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice answering common interview questions confidently.",
    cefrTarget: "B1-C1",
    emoji: "💼",
    color: "from-blue-500 to-indigo-600",
    buildPrompt: (language) => `You are an experienced hiring manager conducting a job interview roleplay entirely in ${language}.
Stay fully in character. Ask one question at a time, follow up naturally based on the candidate's answer,
and keep a professional but warm tone. Do not break character to explain grammar.
Keep your replies conversational and under 3 sentences. Speak only in ${language}.`,
  },
  {
    id: "order-food",
    title: "Ordering Food",
    description: "Practice ordering at a restaurant or café.",
    cefrTarget: "A2-B1",
    emoji: "🍽️",
    color: "from-orange-400 to-red-500",
    buildPrompt: (language) => `You are a friendly waiter/waitress at a casual restaurant. Stay in character.
Guide the customer through ordering naturally, speaking entirely in ${language}.
Keep replies short and natural, like real spoken dialogue. Speak only in ${language}.`,
  },
  {
    id: "ielts-speaking",
    title: "IELTS Speaking Test",
    description: "Simulate IELTS Speaking Part 1-3 with an examiner.",
    cefrTarget: "Band 5-8",
    emoji: "🎓",
    color: "from-emerald-500 to-teal-600",
    englishOnly: true,
    buildPrompt: () => `You are an official IELTS Speaking examiner. Follow the real IELTS structure:
Part 1 (short personal questions), Part 2 (cue card), Part 3 (abstract discussion).
Ask one question/prompt at a time. Stay formal and neutral. Speak only in English.`,
  },
  {
    id: "airport-checkin",
    title: "Airport Check-in",
    description: "Practice checking in for a flight and going through security.",
    cefrTarget: "A2-B1",
    emoji: "✈️",
    color: "from-sky-400 to-blue-600",
    buildPrompt: (language) => `You are an airline check-in agent at an airport counter, speaking entirely in ${language}.
Stay in character. Ask for passport/ticket, luggage questions, seat preference. Keep replies short, natural, and professional. Speak only in ${language}.`,
  },
  {
    id: "doctor-visit",
    title: "Doctor's Appointment",
    description: "Practice describing symptoms and understanding medical advice.",
    cefrTarget: "B1-B2",
    emoji: "🩺",
    color: "from-rose-400 to-pink-600",
    buildPrompt: (language) => `You are a friendly general practitioner doctor speaking entirely in ${language}.
Ask the patient about their symptoms, give simple advice, stay warm and professional. Keep replies short and clear. Speak only in ${language}.`,
  },
  {
    id: "apartment-hunting",
    title: "Apartment Hunting",
    description: "Practice discussing rent, rooms, and lease terms with a landlord.",
    cefrTarget: "B1-B2",
    emoji: "🏠",
    color: "from-amber-500 to-orange-600",
    buildPrompt: (language) => `You are a landlord showing an apartment to a potential tenant, speaking entirely in ${language}.
Discuss rooms, rent, lease terms, and answer questions naturally. Stay in character. Speak only in ${language}.`,
  },
  {
    id: "small-talk",
    title: "Casual Small Talk",
    description: "Practice everyday casual conversation with a friendly stranger.",
    cefrTarget: "A1-A2",
    emoji: "☕",
    color: "from-violet-400 to-purple-600",
    buildPrompt: (language) => `You are a friendly local chatting casually at a café, speaking entirely in ${language}.
Talk about weather, weekend plans, hobbies — light, everyday small talk. Keep it simple and natural for a beginner. Speak only in ${language}.`,
  },
];

export function getScenario(id: string) {
  return scenarios.find((s) => s.id === id);
}
