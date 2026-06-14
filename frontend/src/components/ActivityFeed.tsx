"use client";

import { useEffect, useState } from "react";
import { getLatestCommunicationEvents } from "@/services/communications";
import type { CommunicationEvent } from "@/types/api";

const eventTone: Record<string, string> = {
  DELIVERED: "bg-mint text-leaf ring-1 ring-leaf/15",
  OPENED: "bg-gold/15 text-amber-700 ring-1 ring-gold/25",
  READ: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  CLICKED: "bg-coral/10 text-coral ring-1 ring-coral/20",
  FAILED: "bg-ink/10 text-ink ring-1 ring-ink/10",
};

export function ActivityFeed() {
  const [events, setEvents] = useState<CommunicationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getLatestCommunicationEvents()
      .then((latestEvents) =>
        setEvents(
          latestEvents
            .slice()
            .sort(
              (first, second) =>
                new Date(second.timestamp).getTime() -
                new Date(first.timestamp).getTime(),
            )
            .slice(0, 3),
        ),
      )
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section className="rounded border border-ink/10 bg-white p-4 shadow-soft">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Activity Feed</p>
        <span className="text-xs text-ink/50">Latest 3</span>
      </div>

      {error ? <EmptyState message={error} /> : null}
      {!error && events.length === 0 ? (
        <EmptyState message="No recent communication activity." />
      ) : null}

      {events.length ? (
        <ol className="relative grid gap-2 before:absolute before:bottom-2 before:left-[4.25rem] before:top-2 before:w-px before:bg-ink/10">
          {events.map((event) => {
            const eventType = normalizeEventType(event.event_type);

            return (
              <li
                key={`${event.communication_id}-${eventType}-${event.timestamp}`}
                className="relative grid grid-cols-[4.75rem_1fr] gap-2"
              >
                <span
                  className={`z-10 inline-flex h-6 items-center justify-center rounded px-2 text-[10px] font-semibold ${eventTone[eventType] ?? "bg-ink/10 text-ink ring-1 ring-ink/10"}`}
                >
                  {eventType}
                </span>
                <div className="min-w-0 rounded bg-cloud px-3 py-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">
                      Communication {shortenId(event.communication_id)}
                    </span>
                    <span className="text-xs text-ink/45">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-4 text-ink/60">
                    Campaign {shortenId(event.campaign_id)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded border border-dashed border-ink/15 bg-cloud p-4 text-sm text-ink/55">
      {message}
    </div>
  );
}

function formatTimestamp(timestamp: string) {
  const eventTime = new Date(timestamp).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - eventTime) / 1000));

  if (diffSeconds < 60) {
    return "Just now";
  }
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(eventTime);
}

function shortenId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

function normalizeEventType(eventType: string) {
  return eventType.toUpperCase();
}
