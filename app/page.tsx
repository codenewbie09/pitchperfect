"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Scenario {
  id: string;
  title: string;
  personaDescription: string;
  industry: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
}

interface Session {
  id: string;
  scenarioId: string;
  prospectName: string;
  status: "active" | "completed";
  feedback: {
    overall?: number;
    opener?: { score: number };
    qualification?: { score: number };
    objectionHandling?: { score: number };
    closing?: { score: number };
    notes?: string;
  } | null;
  createdAt: string;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  hard: "bg-red-100 text-red-800 border-red-200",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
};

function DifficultyBadge({ level }: { level: string }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
        difficultyColors[level] || "bg-gray-100 text-gray-800"
      }`}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status === "completed" ? "Completed" : "Active"}
    </span>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session[]>>({});
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [prospectInput, setProspectInput] = useState("");

  const [title, setTitle] = useState("");
  const [persona, setPersona] = useState("");
  const [industry, setIndustry] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, []);

  async function fetchScenarios() {
    const res = await fetch("/api/scenarios");
    if (!res.ok) return;
    const data: Scenario[] = await res.json();
    setScenarios(data);
    await Promise.all(data.map((s) => fetchSessions(s.id)));
  }

  async function fetchSessions(scenarioId: string) {
    const res = await fetch(`/api/sessions?scenarioId=${scenarioId}`);
    if (res.ok) {
      const data = await res.json();
      setSessionsMap((prev) => ({ ...prev, [scenarioId]: data }));
    }
  }

  async function createScenario(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !persona.trim() || !industry.trim()) return;
    setCreating(true);
    const res = await fetch("/api/scenarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, personaDescription: persona, industry, difficulty }),
    });
    if (res.ok) {
      setTitle("");
      setPersona("");
      setIndustry("");
      setDifficulty("medium");
      await fetchScenarios();
    }
    setCreating(false);
  }

  async function createSession(scenarioId: string) {
    if (!prospectInput.trim()) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenarioId, prospectName: prospectInput.trim() }),
    });
    if (res.ok) {
      const session = await res.json();
      setProspectInput("");
      await fetchSessions(scenarioId);
      router.push(`/session/${session.id}`);
    }
  }

  function toggleScenario(id: string) {
    if (activeScenario === id) {
      setActiveScenario(null);
    } else {
      setActiveScenario(id);
      if (!sessionsMap[id]) fetchSessions(id);
    }
  }

  function getStats(scenarioId: string) {
    const all = sessionsMap[scenarioId] || [];
    const completed = all.filter((s) => s.status === "completed");
    const total = all.length;
    const avgScore = completed.length
      ? Math.round(
          completed.reduce((sum, s) => sum + (s.feedback?.overall ?? 0), 0) /
            completed.length,
        )
      : null;
    return { total, completed: completed.length, avgScore };
  }

  function activeSessions(scenarioId: string) {
    return (sessionsMap[scenarioId] || []).filter((s) => s.status === "active");
  }

  function completedSessions(scenarioId: string) {
    return (sessionsMap[scenarioId] || []).filter((s) => s.status === "completed");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">PitchPerfect</h1>
          <span className="text-xs text-gray-500">AI Sales Roleplay</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            New Scenario
          </h2>
          <form onSubmit={createScenario} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. VP of Sales Outreach"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Persona
              </label>
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g. VP of Sales at a B2B SaaS company, 50-200 employees"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Fintech, SaaS, Healthcare"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !title.trim() || !persona.trim() || !industry.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating..." : "Create Scenario"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Scenarios</h2>
          {scenarios.length === 0 && (
            <p className="text-sm text-gray-500 py-8 text-center">
              No scenarios yet. Create one above.
            </p>
          )}
          {scenarios.map((scenario) => {
            const stats = getStats(scenario.id);
            const active = activeSessions(scenario.id);
            const completed = completedSessions(scenario.id);

            return (
              <div
                key={scenario.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleScenario(scenario.id)}
                  className="w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {scenario.title}
                        </p>
                        <DifficultyBadge level={scenario.difficulty} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {scenario.personaDescription}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{scenario.industry}</span>
                        <span>{stats.total} sessions</span>
                        {stats.avgScore !== null && (
                          <span>Avg score: {stats.avgScore}/10</span>
                        )}
                        {stats.completed > 0 && (
                          <span>
                            {Math.round((stats.completed / stats.total) * 100)}%
                            completed
                          </span>
                        )}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        activeScenario === scenario.id ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {activeScenario === scenario.id && (
                  <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        value={prospectInput}
                        onChange={(e) => setProspectInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && createSession(scenario.id)
                        }
                        placeholder="Prospect name..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => createSession(scenario.id)}
                        disabled={!prospectInput.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        Start Session
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Active ({active.length})
                        </h3>
                        <div className="space-y-2">
                          {active.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                              No active sessions
                            </p>
                          )}
                          {active.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => router.push(`/session/${s.id}`)}
                              className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {s.prospectName}
                              </span>
                              <StatusBadge status={s.status} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Completed ({completed.length})
                        </h3>
                        <div className="space-y-2">
                          {completed.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                              No completed sessions
                            </p>
                          )}
                          {completed.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => router.push(`/session/${s.id}`)}
                              className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors"
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {s.prospectName}
                              </span>
                              <div className="flex items-center gap-2">
                                {s.feedback?.overall && (
                                  <span className="text-xs text-gray-500">
                                    {s.feedback.overall}/10
                                  </span>
                                )}
                                <StatusBadge status={s.status} />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
