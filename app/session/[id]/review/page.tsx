"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { scoreColor, scoreTextColor } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface SessionData {
  id: string;
  scenarioId: string;
  prospectName: string;
  status: "active" | "completed";
  feedback: {
    opener: { score: number; feedback: string };
    qualification: { score: number; feedback: string };
    objectionHandling: { score: number; feedback: string };
    closing: { score: number; feedback: string };
    overall: number;
    notes: string;
  } | null;
  prospectBrief: {
    company: string;
    role: string;
    painPoints: string[];
    triggerEvent: string;
    personality: string;
  } | null;
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSession();
      fetchMessages();
    }
  }, [id]);

  async function fetchSession() {
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) setSession(await res.json());
  }

  async function fetchMessages() {
    const res = await fetch(`/api/messages?sessionId=${id}`);
    if (res.ok) setMessages(await res.json());
  }

  async function copyShareLink() {
    const url = `${window.location.origin}/share/${id}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function tryAgain() {
    if (!session?.scenarioId || !session?.prospectName) return;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenarioId: session.scenarioId,
        prospectName: session.prospectName,
      }),
    });
    if (res.ok) {
      const newSession = await res.json();
      router.push(`/session/${newSession.id}`);
    }
  }

  const feedback = session?.feedback;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {session?.prospectName || "Loading..."}
              </h1>
              {session?.prospectBrief && (
                <p className="text-xs text-gray-500">
                  {session.prospectBrief.role} at {session.prospectBrief.company}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400 ml-auto">Review Only</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {!feedback && session?.status === "completed" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 text-sm text-yellow-800 text-center">
            Feedback unavailable
          </div>
        )}

        {feedback && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scorecard</h2>
            <div className="text-center mb-6">
              <span className="text-4xl font-bold text-blue-600">{feedback.overall}</span>
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
                      <span className="text-sm font-medium text-gray-900">{label}</span>
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
                <h3 className="text-sm font-medium text-blue-900 mb-1">Coach Notes</h3>
                <p className="text-sm text-blue-800">{feedback.notes}</p>
              </div>
            )}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={copyShareLink}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {copied ? "Copied!" : "Share"}
              </button>
              <button
                onClick={tryAgain}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Transcript
          </h2>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-white border border-gray-200 text-gray-900 rounded-tl-sm"
                    : "bg-blue-600 text-white rounded-tr-sm"
                }`}
              >
                <p className="text-xs font-medium mb-1 opacity-60">
                  {msg.role === "assistant" ? session?.prospectName ?? "Prospect" : "You (SDR)"}
                </p>
                <p>{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "assistant" ? "text-gray-400" : "text-blue-200"
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
            <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
