"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { sendChatMessage } from "@/services/chat";
import type { ChatResponse } from "@/types/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  response?: ChatResponse;
};

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const userMessage = input.trim();
    setMessages((current) => [...current, { role: "user", content: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendChatMessage({ message: userMessage });
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `Intent: ${response.intent}`,
          response,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: (err as Error).message },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="AI Chat"
        title="Ask SonarIQ for marketing actions"
        description="Use natural-language prompts to preview segments, inspect analytics, and route campaign questions through the backend chat agent."
      />

      <section className="rounded border border-ink/10 bg-white shadow-soft">
        <div className="h-[520px] overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-ink/55">
              <p>Try: Show me customers from Chennai who spent more than 5000</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-3xl rounded p-4 ${
                    message.role === "user"
                      ? "ml-auto bg-ink text-white"
                      : "mr-auto bg-cloud text-ink"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  {message.response ? (
                    <pre className="mt-3 max-h-72 overflow-auto rounded bg-white/80 p-3 text-xs text-ink">
                      {JSON.stringify(message.response, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="flex gap-3 border-t border-ink/10 p-4">
          <input
            className="h-12 flex-1 rounded border border-ink/15 px-4 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about segments, campaign analytics, or overview"
          />
          <button
            className="h-12 rounded bg-leaf px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </>
  );
}
