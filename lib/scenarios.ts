export type Scenario = {
  id: string;
  title: string;
  description: string;
  cefrTarget: string;
  systemPrompt: string;
};

export const scenarios: Scenario[] = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice answering common interview questions confidently.",
    cefrTarget: "B1-C1",
    systemPrompt: `You are an experienced hiring manager conducting a job interview roleplay in English.
Stay fully in character. Ask one question at a time, follow up naturally based on the candidate's answer,
and keep a professional but warm tone. Do not break character to explain grammar.
Keep your replies conversational and under 3 sentences.`,
  },
  {
    id: "order-food",
    title: "Ordering Food",
    description: "Practice ordering at a restaurant or café.",
    cefrTarget: "A2-B1",
    systemPrompt: `You are a friendly waiter/waitress at a casual restaurant. Stay in character.
Guide the customer through ordering naturally. Keep replies short and natural, like real spoken dialogue.`,
  },
  {
    id: "ielts-speaking",
    title: "IELTS Speaking Test",
    description: "Simulate IELTS Speaking Part 1-3 with an examiner.",
    cefrTarget: "Band 5-8",
    systemPrompt: `You are an official IELTS Speaking examiner. Follow the real IELTS structure:
Part 1 (short personal questions), Part 2 (cue card), Part 3 (abstract discussion).
Ask one question/prompt at a time. Stay formal and neutral.`,
  },
];

export function getScenario(id: string) {
  return scenarios.find((s) => s.id === id);
}
