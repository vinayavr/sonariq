"use client";

import { FormEvent, useState } from "react";
import { FormField, inputClass, textareaClass } from "@/components/FormField";
import { PageHeader } from "@/components/PageHeader";
import { upsertStoredCampaign } from "@/lib/campaignStore";
import { createCampaign, launchCampaign, previewCampaign } from "@/services/campaigns";
import type {
  CampaignLaunchResponse,
  CampaignPreviewResponse,
  CampaignResponse,
  SegmentPreviewRequest,
} from "@/types/api";

export default function CampaignsPage() {
  const [campaign, setCampaign] = useState({
    name: "",
    goal: "",
    channel: "email",
    message_template: "Hi {first_name}, we picked something special for you.",
  });
  const [segment, setSegment] = useState({
    city: "",
    lifetime_spend_greater_than: "",
    minimum_order_count: "",
  });
  const [campaignId, setCampaignId] = useState("");
  const [created, setCreated] = useState<CampaignResponse | null>(null);
  const [preview, setPreview] = useState<CampaignPreviewResponse | null>(null);
  const [launch, setLaunch] = useState<CampaignLaunchResponse | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Creating campaign...");
    try {
      const response = await createCampaign(campaign);
      setCreated(response);
      setCampaignId(response.id);
      upsertStoredCampaign({
        id: response.id,
        name: response.name,
        status: "created",
        updatedAt: new Date().toISOString(),
      });
      setStatus("Campaign created.");
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function previewCurrent() {
    if (!campaignId) {
      setStatus("Enter or create a campaign ID first.");
      return;
    }

    setStatus("Previewing campaign...");
    try {
      const response = await previewCampaign({
        campaign_id: campaignId,
        segment_filters: toSegmentRequest(segment),
      });
      setPreview(response);
      upsertStoredCampaign({
        id: campaignId,
        name: response.campaign_name,
        audience: response.audience_count,
        status: "previewed",
        updatedAt: new Date().toISOString(),
      });
      setStatus("Campaign preview ready.");
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function launchCurrent() {
    if (!campaignId) {
      setStatus("Enter or create a campaign ID first.");
      return;
    }

    setStatus("Launching campaign...");
    try {
      const response = await launchCampaign(campaignId, {
        segment_filters: toSegmentRequest(segment),
      });
      setLaunch(response);
      upsertStoredCampaign({
        id: campaignId,
        name: created?.name ?? preview?.campaign_name ?? "Campaign",
        audience: preview?.audience_count,
        status: "launched",
        updatedAt: new Date().toISOString(),
      });
      setStatus("Campaign launched.");
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Create, size, and launch campaigns"
        description="Move from campaign setup to audience preview to launch while reusing the same segment filters."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <form onSubmit={create} className="rounded border border-ink/10 bg-white p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Campaign name">
              <input
                className={inputClass}
                value={campaign.name}
                onChange={(event) => setCampaign({ ...campaign, name: event.target.value })}
                required
              />
            </FormField>
            <FormField label="Channel">
              <select
                className={inputClass}
                value={campaign.channel}
                onChange={(event) => setCampaign({ ...campaign, channel: event.target.value })}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="push">Push</option>
              </select>
            </FormField>
            <FormField label="Goal">
              <input
                className={inputClass}
                value={campaign.goal}
                onChange={(event) => setCampaign({ ...campaign, goal: event.target.value })}
                required
              />
            </FormField>
            <FormField label="Campaign ID">
              <input
                className={inputClass}
                value={campaignId}
                onChange={(event) => setCampaignId(event.target.value)}
                placeholder="Created campaign ID"
              />
            </FormField>
          </div>
          <div className="mt-4">
            <FormField label="Message template">
              <textarea
                className={textareaClass}
                value={campaign.message_template}
                onChange={(event) =>
                  setCampaign({ ...campaign, message_template: event.target.value })
                }
                required
              />
            </FormField>
          </div>

          <button className="mt-5 h-11 rounded bg-leaf px-5 text-sm font-semibold text-white">
            Create Campaign
          </button>
        </form>

        <section className="rounded border border-ink/10 bg-white p-5 shadow-soft">
          <div className="grid gap-4">
            <FormField label="Segment city">
              <input
                className={inputClass}
                value={segment.city}
                onChange={(event) => setSegment({ ...segment, city: event.target.value })}
                placeholder="Chennai"
              />
            </FormField>
            <FormField label="Lifetime spend greater than">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={segment.lifetime_spend_greater_than}
                onChange={(event) =>
                  setSegment({ ...segment, lifetime_spend_greater_than: event.target.value })
                }
              />
            </FormField>
            <FormField label="Minimum order count">
              <input
                className={inputClass}
                type="number"
                min="0"
                value={segment.minimum_order_count}
                onChange={(event) =>
                  setSegment({ ...segment, minimum_order_count: event.target.value })
                }
              />
            </FormField>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={previewCurrent}
              className="h-11 rounded bg-ink px-5 text-sm font-semibold text-white"
            >
              Preview Campaign
            </button>
            <button
              type="button"
              onClick={launchCurrent}
              className="h-11 rounded bg-coral px-5 text-sm font-semibold text-white"
            >
              Launch Campaign
            </button>
          </div>
          {status ? <p className="mt-4 text-sm text-ink/65">{status}</p> : null}
        </section>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <ResultBlock
          title="Created Campaign"
          stats={
            created
              ? [
                  ["Campaign Name", created.name],
                  ["Campaign ID", created.id],
                  ["Channel", created.channel],
                  ["Goal", created.goal],
                ]
              : []
          }
        />
        <ResultBlock
          title="Preview Result"
          stats={
            preview
              ? [
                  ["Audience Count", preview.audience_count.toLocaleString("en-IN")],
                  ["Estimated Messages", preview.estimated_messages.toLocaleString("en-IN")],
                ]
              : []
          }
        />
        <ResultBlock
          title="Launch Result"
          stats={
            launch
              ? [
                  ["Campaign ID", launch.campaign_id],
                  [
                    "Communications Created",
                    launch.communications_created.toLocaleString("en-IN"),
                  ],
                ]
              : []
          }
        />
      </section>
      <CampaignLifecycleTimeline created={created} preview={preview} launch={launch} />
      <DeveloperLogs
        responses={{
          created_campaign: created,
          preview_result: preview,
          launch_result: launch,
        }}
      />
    </>
  );
}

function CampaignLifecycleTimeline({
  created,
  preview,
  launch,
}: {
  created: CampaignResponse | null;
  preview: CampaignPreviewResponse | null;
  launch: CampaignLaunchResponse | null;
}) {
  const steps = [
    {
      label: "Created",
      complete: Boolean(created),
      detail: created
        ? `${created.name} created ${formatRelativeTimestamp(created.created_at)}.`
        : "Create a campaign to start the timeline.",
    },
    {
      label: "Launched",
      complete: Boolean(launch),
      detail: launch
        ? `Campaign ${shortenId(launch.campaign_id)} launched.`
        : "Launch the campaign after previewing your audience.",
    },
    {
      label: "Communications Sent",
      complete: Boolean(launch?.communications_created),
      detail: launch
        ? `${launch.communications_created.toLocaleString("en-IN")} communications created.`
        : "Communications will appear after launch.",
    },
    {
      label: "Engagement Recorded",
      complete: Boolean(launch?.communications_created),
      detail: launch
        ? "Delivery and engagement events are available in analytics and the activity feed."
        : "Engagement appears when campaign events are recorded.",
    },
    {
      label: "Revenue Attributed",
      complete: false,
      detail: preview
        ? "Open Analytics after launch to inspect attributed orders and revenue."
        : "Preview and launch a campaign before reviewing revenue attribution.",
    },
  ];

  return (
    <section className="mt-6 rounded border border-ink/10 bg-white p-4 shadow-soft">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Campaign Lifecycle Timeline</p>
        <span className="text-xs text-ink/50">Created - Launched - Revenue Attributed</span>
      </div>
      <ol className="grid gap-3 md:grid-cols-5">
        {steps.map((step) => (
          <li key={step.label} className="rounded bg-cloud p-3">
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  step.complete ? "bg-leaf" : "bg-ink/20"
                }`}
              />
              <p className="text-sm font-semibold text-ink">{step.label}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-ink/60">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ResultBlock({
  title,
  stats,
}: {
  title: string;
  stats: [string, string][];
}) {
  return (
    <div className="rounded border border-ink/10 bg-white p-4 shadow-soft">
      <p className="text-sm font-semibold text-ink">{title}</p>
      {stats.length ? (
        <div className="mt-3 grid gap-2">
          {stats.map(([label, value]) => (
            <div key={label} className="rounded bg-cloud p-2">
              <p className="text-xs font-medium text-ink/50">{label}</p>
              <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded bg-cloud p-3 text-sm text-ink/55">No result yet</p>
      )}
    </div>
  );
}

function DeveloperLogs({
  responses,
}: {
  responses: Record<string, unknown>;
}) {
  const hasResponses = Object.values(responses).some(Boolean);

  return (
    <details className="mt-4 rounded border border-ink/10 bg-white p-3 text-xs text-ink shadow-soft">
      <summary className="cursor-pointer font-semibold text-ink/65">Developer Logs</summary>
      <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-white/80 p-3">
        {hasResponses ? JSON.stringify(responses, null, 2) : "No API responses yet."}
      </pre>
    </details>
  );
}

function shortenId(id: string) {
  return id.length > 12 ? `${id.slice(0, 8)}...${id.slice(-4)}` : id;
}

function formatRelativeTimestamp(timestamp: string) {
  const eventTime = new Date(timestamp).getTime();
  const diffSeconds = Math.max(0, Math.floor((Date.now() - eventTime) / 1000));

  if (diffSeconds < 60) {
    return "just now";
  }
  if (diffSeconds < 3600) {
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diffSeconds < 86400) {
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (diffSeconds < 172800) {
    return "yesterday";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(eventTime);
}

function toSegmentRequest(segment: {
  city: string;
  lifetime_spend_greater_than: string;
  minimum_order_count: string;
}): SegmentPreviewRequest {
  return Object.fromEntries(
    Object.entries({
      city: segment.city.trim() || undefined,
      lifetime_spend_greater_than:
        segment.lifetime_spend_greater_than === ""
          ? undefined
          : Number(segment.lifetime_spend_greater_than),
      minimum_order_count:
        segment.minimum_order_count === "" ? undefined : Number(segment.minimum_order_count),
    }).filter(([, value]) => value !== undefined),
  ) as SegmentPreviewRequest;
}
