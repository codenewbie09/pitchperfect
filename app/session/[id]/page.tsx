"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface SessionData {
  id: string;
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

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
};

function Scorecard({
  feedback,
  onClose,
}: {
  feedback: NonNullable<SessionData["feedback"]>;
  onClose: () => void;
}) {
  const categories = [
    { key: "opener", label: "Opener" },
    { key: "qualification", label: "Qualification" },
    { key: "objectionHandling", label: "Objection Handling" },
    { key: "closing", label: "Closing" },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Session Score</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-blue-600">{feedback.overall}</span>
            <span className="text-gray-400 text-lg">/10</span>
            <p className="text-sm text-gray-500 mt-1">Overall Score</p>
          </div>

          {categories.map(({ key, label }) => {
            const cat = feedback[key];
            return (
              <div key={key} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{label}</span>
                  <span
                    className={`text-sm font-bold ${
                      cat.score >= 7
                        ? "text-green-600"
                        : cat.score >= 4
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {cat.score}/10
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      cat.score >= 7
                        ? "bg-green-500"
                        : cat.score >= 4
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${cat.score * 10}%` }}
                  />
                </div>
                {cat.feedback && (
                  <p className="text-xs text-gray-500 mt-2">{cat.feedback}</p>
                )}
              </div>
            );
          })}

          {feedback.notes && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-1">Coach Notes</h3>
              <p className="text-sm text-blue-800">{feedback.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [showScorecard, setShowScorecard] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchSession();
      fetchMessages();
    }
  }, [id]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, waitingForAI]);

  useEffect(() => {
    if (session?.status === "completed" && session?.feedback) {
      setShowScorecard(true);
    }
  }, [session?.status, session?.feedback]);

  async function fetchSession() {
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) setSession(await res.json());
  }

  async function fetchMessages() {
    const res = await fetch(`/api/messages?sessionId=${id}`);
    if (res.ok) setMessages(await res.json());
  }

  async function sendReply() {
    if (!input.trim() || sending) return;
    setSending(true);
    setWaitingForAI(true);

    const res = await fetch(`/api/sessions/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input.trim() }),
    });
    setInput("");
    if (res.ok) {
      await fetchMessages();
      await fetchSession();
    }
    setSending(false);
    setWaitingForAI(false);
  }

  const isFirstTurn = messages.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
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
          </div>
          {session && (
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full border ${
                statusColors[session.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {session.status === "completed" ? "Completed" : "Active"}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 overflow-y-auto flex flex-col gap-4">
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

        {waitingForAI && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !waitingForAI && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">
                Your prospect is ready. Send your opener.
              </p>
              {session?.prospectBrief && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-left max-w-sm mx-auto">
                  <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                    Prospect Brief
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {session.prospectName}
                  </p>
                  <p className="text-xs text-gray-600">
                    {session.prospectBrief.role} at {session.prospectBrief.company}
                  </p>
                  {session.prospectBrief.triggerEvent && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {session.prospectBrief.triggerEvent}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEnd} />
      </div>

      {session?.status === "active" && (
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder={
                  isFirstTurn
                    ? "Write your opener as the SDR..."
                    : "Reply as the SDR..."
                }
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendReply}
                disabled={sending || !input.trim()}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {session?.status === "completed" && (
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <div className="bg-blue-50 text-blue-700 text-center py-3 rounded-xl text-sm font-medium">
              This session is complete.{" "}
              <button
                onClick={() => setShowScorecard(true)}
                className="underline font-semibold"
              >
                View scorecard
              </button>
            </div>
          </div>
        </div>
      )}

      {showScorecard && session?.feedback && (
        <Scorecard
          feedback={session.feedback}
          onClose={() => setShowScorecard(false)}
        />
      )}
    </div>
  );
}
