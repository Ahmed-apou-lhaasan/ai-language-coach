import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const scenarios = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice answering common interview questions confidently.",
    level: "B1-C1",
  },
  {
    id: "order-food",
    title: "Ordering Food",
    description: "Practice ordering at a restaurant or café.",
    level: "A2-B1",
  },
  {
    id: "ielts-speaking",
    title: "IELTS Speaking Test",
    description: "Simulate IELTS Speaking Part 1-3 with an examiner.",
    level: "Band 5-8",
  },
];

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-2xl font-bold text-gray-900">
            AI Language Coach
          </h1>
          <a href="/logout" className="text-xs text-gray-400">Sign out</a>
        </div>
        <p className="text-gray-500 mb-6">Choose a scenario to practice</p>

        <div className="space-y-3">
          {scenarios.map((s) => (
            <a
              key={s.id}
              href={`/practice/${s.id}`}
              className="block bg-white border rounded-2xl p-4 hover:border-blue-400 transition"
            >
              <div className="flex justify-between items-start">
                <h2 className="font-semibold text-gray-900">{s.title}</h2>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                  {s.level}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{s.description}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
