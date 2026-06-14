"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { sendChatMessage } from "@/services/chat";
import type { ChatResponse } from "@/types/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const promptSuggestions = [
  "Which campaign generated the highest revenue?",
  "Show top-performing campaigns.",
  "Find dormant customers.",
  "Summarize Monsoon Rewards.",
  "Who should I target next?",
];

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
              <p>Ask SonarIQ a question to receive marketing insights.</p>
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
                  {message.response ? (
                    <AssistantResponse response={message.response} />
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  {message.response ? (
                    <DeveloperLogs response={message.response} />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-ink/10 p-4">
          <form onSubmit={submit} className="flex gap-3">
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
          <div className="mt-3 flex flex-wrap gap-2">
            {promptSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setInput(suggestion)}
                className="rounded border border-ink/10 bg-cloud px-3 py-1.5 text-xs font-medium text-ink/70 transition hover:border-leaf/30 hover:text-leaf"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function AssistantResponse({ response }: { response: ChatResponse }) {
  if (response.result.error) {
    return <p className="text-sm text-coral">{String(response.result.error)}</p>;
  }

  if (response.intent === "best_campaign") {
    return (
      <InsightCard
        title="Best Campaign"
        stats={[
          ["Campaign Name", textValue(response.result.campaign_name)],
          ["Attributed Revenue", moneyValue(response.result.attributed_revenue)],
          ["Conversion Rate", percentValue(response.result.conversion_rate)],
          ["Communications Sent", numberValue(response.result.communications_sent)],
        ]}
      />
    );
  }

  if (response.intent === "campaign_insight" || response.intent === "campaign_analytics") {
    const stats: [string, string][] = [
      ["Delivered", numberValue(response.result.delivered)],
      ["Opened", numberValue(response.result.opened)],
      ["Read", numberValue(response.result.read)],
      ["Clicked", numberValue(response.result.clicked)],
      ["Attributed Revenue", moneyValue(response.result.attributed_revenue)],
      ["Attributed Orders", numberValue(response.result.attributed_orders)],
      ["Conversion Rate", percentValue(response.result.conversion_rate)],
    ];

    if (response.result.campaign_name) {
      stats.unshift(["Campaign Name", textValue(response.result.campaign_name)]);
    }

    return (
      <InsightCard
        title="Campaign Insights"
        stats={stats}
      />
    );
  }

  if (response.intent === "segment_preview" || response.intent === "campaign_preview") {
    const filters = Object.entries(response.parameters).filter(([, value]) => value !== undefined);

    return (
      <div className="grid gap-3">
        <InsightCard
          title="Segment Preview"
          stats={[["Audience Count", numberValue(response.result.audience_count)]]}
        />
        <div className="rounded bg-white/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
            Filters Applied
          </p>
          {filters.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded bg-mint px-2 py-1 text-xs font-medium text-leaf"
                >
                  {formatLabel(key)}: {String(value)}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink/55">No filters applied.</p>
          )}
        </div>
        <div className="rounded bg-white/80 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">
            Business Interpretation
          </p>
          <p className="mt-2 text-sm text-ink/70">
            {segmentSummary(response.result.audience_count, filters.length)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <InsightCard
      title="Overview"
      stats={Object.entries(response.result).map(([key, value]) => [
        formatLabel(key),
        formatUnknownValue(value),
      ])}
    />
  );
}

function InsightCard({
  title,
  stats,
}: {
  title: string;
  stats: [string, string][];
}) {
  return (
    <div className="rounded bg-white/80 p-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded bg-cloud p-2">
            <p className="text-xs font-medium text-ink/50">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeveloperLogs({ response }: { response: ChatResponse }) {
  return (
    <details className="mt-3 rounded bg-white/70 p-3 text-xs text-ink">
      <summary className="cursor-pointer font-semibold text-ink/65">Developer Logs</summary>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded bg-white/80 p-3">
        {JSON.stringify(response, null, 2)}
      </pre>
    </details>
  );
}

function segmentSummary(audienceCount: unknown, filterCount: number) {
  const count = typeof audienceCount === "number" ? audienceCount : Number(audienceCount ?? 0);
  if (count <= 0) {
    return "No matching audience was found for this request yet.";
  }

  const filterText = filterCount === 0 ? "broad audience" : "filtered audience";
  return `This ${filterText} includes ${numberValue(count)} customers who can be used for campaign planning.`;
}

function formatLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function textValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function numberValue(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString("en-IN") : "-";
}

function moneyValue(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? currency.format(numericValue) : "-";
}

function percentValue(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(1)}%` : "-";
}

function formatUnknownValue(value: unknown) {
  if (typeof value === "number") {
    return numberValue(value);
  }
  if (typeof value === "string" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
