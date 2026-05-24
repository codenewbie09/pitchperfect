"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { scoreColor, scoreTextColor } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface Feedback {
  opener: { score: number; feedback: string };
  qualification: { score: number; feedback: string };
  objectionHandling: { score: number; feedback: string };
  closing: { score: number; feedback: string };
  overall: number;
  notes: string;
}

interface ShareData {
  session: {
    id: string;
    prospectName: string;
    prospectBrief: {
      company: string;
      role: string;
      painPoints: string[];
      triggerEvent: string;
      personality: string;
    } | null;
    status: string;
    feedback: Feedback | null;
    createdAt: string;
  };
  scenario: {
    personaDescription: string;
    difficulty: string;
  };
  messages: Message[];
}

export default function SharePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/sessions/${id}/share`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then(setData)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h1>
          <p className="text-sm text-gray-500">
            This session does not exist or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const { session, scenario, messages } = data;
  const feedback = session.feedback;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {session.prospectName}
              </h1>
              {session.prospectBrief && (
                <p className="text-sm text-gray-500 mt-1">
                  {session.prospectBrief.role} at{" "}
                  {session.prospectBrief.company}
                </p>
              )}
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
              {scenario.difficulty}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {scenario.personaDescription}
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {feedback && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Scorecard
            </h2>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-blue-600">
                {feedback.overall}
              </span>
              <span className="text-gray-400 text-lg">/10</span>
              <p className="text-sm text-gray-500 mt-1">Overall Score</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { key: "opener", label: "Opener" },
                  { key: "qualification", label: "Qualification" },
                  { key: "objectionHandling", label: "Objection Handling" },
                  { key: "closing", label: "Closing" },
                ] as const
              ).map(({ key, label }) => {
                const cat = feedback[key];
                return (
                  <div key={key} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {label}
                      </span>
                      <span className={`text-sm font-bold ${scoreTextColor(cat.score)}`}>
                        {cat.score}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${scoreColor(cat.score)}`}
                        style={{ width: `${cat.score * 10}%` }}
                      />
                    </div>
                    {cat.feedback && (
                      <p className="text-xs text-gray-500">{cat.feedback}</p>
                    )}
                  </div>
                );
              })}
            </div>
            {feedback.notes && (
              <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Coach Notes
                </h3>
                <p className="text-sm text-blue-800">{feedback.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Transcript
          </h2>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "assistant" ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-white border border-gray-200 text-gray-900 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}
              >
                <p className="text-xs font-medium mb-1 opacity-60">
                  {msg.role === "assistant"
                    ? session.prospectName
                    : "You (SDR)"}
                </p>
                <p>{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "assistant"
                      ? "text-gray-400"
                      : "text-blue-200"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No messages yet.
            </p>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Powered by PitchPerfect
          </a>
        </div>
      </footer>
    </div>
  );
}
