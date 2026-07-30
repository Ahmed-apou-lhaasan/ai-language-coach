import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const scenarios = [
  {
    id: "job-interview",
    title: "Job Interview",
    description: "Practice answering common interview questions confidently.",
    level: "B1-C1",
    emoji: "💼",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "order-food",
    title: "Ordering Food",
    description: "Practice ordering at a restaurant or café.",
    level: "A2-B1",
    emoji: "🍽️",
    color: "from-orange-400 to-red-500",
  },
  {
    id: "ielts-speaking",
    title: "IELTS Speaking Test",
    description: "Simulate IELTS Speaking Part 1-3 with an examiner.",
    level: "Band 5-8",
    emoji: "🎓",
    color: "from-emerald-500 to-teal-600",
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_language")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.target_language) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white px-5 py-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6 animate-fade-up">
          <div>
            <h1 className="text-3xl font-extrabold gradient-text tracking-tight">
              Language Coach
            </h1>
            <p className="text-gray-400 text-sm mt-0.5 capitalize">
              Learning {profile.target_language}
            </p>
          </div>
          <a
            href="/logout"
            className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1.5 shadow-sm"
          >
            Sign out
          </a>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <a
            href="/vocabulary"
            className="card-hover bg-white rounded-3xl p-4 shadow-sm border border-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-lg mb-2">
              📚
            </div>
            <p className="font-bold text-gray-900 text-sm">My Vocabulary</p>
            <p className="text-xs text-gray-400 mt-0.5">Saved words</p>
          </a>
          <a
            href="/stories"
            className="card-hover bg-white rounded-3xl p-4 shadow-sm border border-gray-100"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-lg mb-2">
              📖
            </div>
            <p className="font-bold text-gray-900 text-sm">Stories</p>
            <p className="text-xs text-gray-400 mt-0.5">Read & learn</p>
          </a>
        </div>

        <p className="text-gray-500 mb-3 text-sm font-bold uppercase tracking-wide animate-fade-up" style={{ animationDelay: "0.15s" }}>
          Practice Scenarios
        </p>

        <div className="space-y-3">
          {scenarios.map((s, i) => (
            <a
              key={s.id}
              href={`/practice/${s.id}`}
              className="card-hover block bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-fade-up"
              style={{ animationDelay: `${0.2 + i * 0.07}s` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-2xl shadow-md flex-shrink-0 animate-float`}
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {s.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h2 className="font-bold text-gray-900">{s.title}</h2>
                    <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full whitespace-nowrap">
                      {s.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-0.5 leading-snug">
                    {s.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
