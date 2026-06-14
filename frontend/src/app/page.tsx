"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { getAnalyticsOverview, getCampaignAnalytics } from "@/services/analytics";
import { getRecentCampaigns } from "@/services/campaigns";
import type { AnalyticsOverview, CampaignAnalytics, CampaignResponse } from "@/types/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [campaigns, setCampaigns] = useState<DashboardCampaign[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalyticsOverview()
      .then(setOverview)
      .catch((err: Error) => setError(err.message));

    async function loadRecentCampaignAnalytics() {
      const recentCampaigns = await getRecentCampaigns();
      const campaignsWithAnalytics = await Promise.all(
        recentCampaigns.map(async (campaign) => {
          try {
            return {
              ...campaign,
              analytics: await getCampaignAnalytics(campaign.id),
            };
          } catch {
            return { ...campaign };
          }
        }),
      );

      setCampaigns(campaignsWithAnalytics);
    }

    loadRecentCampaignAnalytics();
  }, []);

  const topCampaign = useMemo(
    () => campaigns[0],
    [campaigns],
  );

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title="Marketing performance at a glance"
        description="Track customer scale, order activity, campaign volume, and revenue attribution."
      />

      {error ? <StatusMessage tone="error" message={error} /> : null}
      {!overview && !error ? <StatusMessage message="Loading dashboard..." /> : null}

      {overview ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total Customers" value={overview.total_customers} tone="leaf" />
            <MetricCard label="Total Orders" value={overview.total_orders} />
            <MetricCard label="Total Campaigns" value={overview.total_campaigns} tone="gold" />
            <MetricCard label="Total Revenue" value={currency.format(overview.total_revenue)} />
            <MetricCard
              label="Attributed Revenue"
              value={currency.format(overview.attributed_revenue)}
              tone="coral"
            />
          </section>

          <section className="mt-3 grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
            <TopCampaignCard campaign={topCampaign} />
            <PerformanceSnapshot campaign={topCampaign} />
          </section>

          <section className="mt-3 grid items-start gap-3 xl:grid-cols-[1.25fr_0.75fr]">
            <RecentCampaignsTable campaigns={campaigns} />
            <ActivityFeed />
          </section>
        </>
      ) : null}
    </>
  );
}

type DashboardCampaign = CampaignResponse & {
  analytics?: CampaignAnalytics;
};

function TopCampaignCard({ campaign }: { campaign?: DashboardCampaign }) {
  return (
    <section className="rounded border border-ink/10 bg-white p-3 shadow-soft">
      <p className="text-sm font-semibold text-leaf">Latest Campaign</p>
      {campaign?.analytics ? (
        <>
          <h2 className="mt-1 truncate text-lg font-semibold text-ink">{campaign.name}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <MiniStat
              label="Attributed Revenue"
              value={currency.format(campaign.analytics.attributed_revenue)}
            />
            <MiniStat
              label="Conversion"
              value={`${campaign.analytics.conversion_rate.toFixed(1)}%`}
            />
            <MiniStat
              label="Communications Sent"
              value={campaign.analytics.communications_sent}
            />
            <MiniStat label="Opened" value={campaign.analytics.opened} />
            <MiniStat label="Read" value={campaign.analytics.read} />
            <MiniStat label="Clicked" value={campaign.analytics.clicked} />
            <MiniStat
              label="Attributed Orders"
              value={campaign.analytics.attributed_orders}
            />
          </div>
        </>
      ) : (
        <EmptyState message="No campaign analytics available yet." />
      )}
    </section>
  );
}

function PerformanceSnapshot({
  campaign,
}: {
  campaign?: DashboardCampaign;
}) {
  const analytics = campaign?.analytics;

  return (
    <section className="rounded border border-ink/10 bg-white p-3 shadow-soft">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">Campaign Performance Snapshot</p>
        <span className="rounded bg-mint px-2 py-1 text-xs font-medium text-leaf">
          Latest Campaign Snapshot
        </span>
      </div>
      {analytics ? (
        <>
          <h2 className="mb-2 truncate text-base font-semibold text-ink">{campaign.name}</h2>
          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-7">
            <MiniStat label="Campaign Name" value={campaign.name} />
            <MiniStat
              label="Attributed Revenue"
              value={currency.format(analytics.attributed_revenue)}
            />
            <MiniStat
              label="Conversion Rate"
              value={`${analytics.conversion_rate.toFixed(1)}%`}
            />
            <MiniStat label="Communications Sent" value={analytics.communications_sent} />
            <MiniStat label="Opened" value={analytics.opened} />
            <MiniStat label="Read" value={analytics.read} />
            <MiniStat label="Clicked" value={analytics.clicked} />
            <MiniStat label="Attributed Orders" value={analytics.attributed_orders} />
          </div>
        </>
      ) : (
        <EmptyState message="No campaign analytics available yet." />
      )}
    </section>
  );
}

function RecentCampaignsTable({ campaigns }: { campaigns: DashboardCampaign[] }) {
  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <section className="rounded border border-ink/10 bg-white p-3 shadow-soft">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Recent Campaigns</p>
        <span className="text-xs text-ink/50">Latest 3</span>
      </div>
      {recentCampaigns.length ? (
        <div className="overflow-hidden">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-[0.12em] text-ink/45">
              <tr>
                <th className="py-2 pr-4 font-semibold">Campaign</th>
                <th className="py-2 pr-4 font-semibold">Audience</th>
                <th className="py-2 pr-4 font-semibold">Revenue</th>
                <th className="py-2 pr-4 font-semibold">Conversion</th>
                <th className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {recentCampaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="max-w-44 truncate py-1.5 pr-4 font-medium text-ink">{campaign.name}</td>
                  <td className="py-1.5 pr-4 text-ink/65">
                    {campaign.analytics?.communications_sent ?? "-"}
                  </td>
                  <td className="py-1.5 pr-4 text-ink/65">
                    {currency.format(campaign.analytics?.attributed_revenue ?? 0)}
                  </td>
                  <td className="py-1.5 pr-4 text-ink/65">
                    {(campaign.analytics?.conversion_rate ?? 0).toFixed(1)}%
                  </td>
                  <td className="py-1.5">
                    <StatusBadge launched={Boolean(campaign.analytics?.communications_sent)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState message="Campaigns created from the Campaigns page will appear here." />
      )}
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded bg-cloud p-1.5">
      <p className="text-xs font-medium text-ink/50">{label}</p>
      <p className="truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function StatusBadge({ launched }: { launched: boolean }) {
  const label = launched ? "Launched" : "Created";
  const tone = launched ? "leaf" : "ink";

  return (
    <span className={`rounded px-2 py-1 text-xs font-semibold ${badgeTone(tone)}`}>
      {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded border border-dashed border-ink/15 bg-cloud p-4 text-sm text-ink/55">
      {message}
    </div>
  );
}

function badgeTone(tone: "leaf" | "coral" | "gold" | "ink") {
  const tones = {
    leaf: "bg-mint text-leaf",
    coral: "bg-coral/10 text-coral",
    gold: "bg-gold/15 text-amber-700",
    ink: "bg-ink/10 text-ink",
  };

  return tones[tone];
}

function StatusMessage({
  message,
  tone = "default",
}: {
  message: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`rounded border p-4 text-sm ${
        tone === "error"
          ? "border-coral/30 bg-coral/10 text-coral"
          : "border-ink/10 bg-white text-ink/65"
      }`}
    >
      {message}
    </div>
  );
}
