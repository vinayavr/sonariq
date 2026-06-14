"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FormField, inputClass } from "@/components/FormField";
import { MetricCard } from "@/components/MetricCard";
import { PageHeader } from "@/components/PageHeader";
import { getCampaignAnalytics } from "@/services/analytics";
import type { CampaignAnalytics } from "@/types/api";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function AnalyticsPage() {
  const [campaignId, setCampaignId] = useState("");
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function loadAnalytics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Loading campaign analytics...");
    try {
      setAnalytics(await getCampaignAnalytics(campaignId));
      setStatus(null);
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  const funnelData = useMemo(
    () =>
      analytics
        ? [
            { name: "Delivered", value: analytics.delivered },
            { name: "Opened", value: analytics.opened },
            { name: "Read", value: analytics.read },
            { name: "Clicked", value: analytics.clicked },
            { name: "Failed", value: analytics.failed },
          ]
        : [],
    [analytics],
  );

  const performanceMetrics = useMemo(
    () =>
      analytics
        ? [
            [
              "Delivery Rate",
              percentFrom(analytics.delivered, analytics.communications_sent),
            ],
            ["Open Rate", percentFrom(analytics.opened, analytics.delivered)],
            ["Read Rate", percentFrom(analytics.read, analytics.opened)],
            ["Click-Through Rate", percentFrom(analytics.clicked, analytics.delivered)],
            ["Click-to-Read Rate", percentFrom(analytics.clicked, analytics.read || analytics.opened)],
            [
              "Revenue per Attributed Order",
              moneyFrom(analytics.attributed_revenue, analytics.attributed_orders),
            ],
            ["Failure Rate", percentFrom(analytics.failed, analytics.communications_sent)],
          ]
        : [],
    [analytics],
  );

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Campaign outcome analysis"
        description="Inspect delivery, engagement, attribution, revenue, and conversion rate for a selected campaign."
      />

      <form onSubmit={loadAnalytics} className="mb-6 flex flex-col gap-3 md:flex-row md:items-end">
        <div className="md:min-w-[420px]">
          <FormField label="Campaign ID">
            <input
              className={inputClass}
              value={campaignId}
              onChange={(event) => setCampaignId(event.target.value)}
              required
            />
          </FormField>
        </div>
        <button className="h-11 rounded bg-leaf px-5 text-sm font-semibold text-white">
          Load Analytics
        </button>
      </form>
      {status ? <p className="mb-5 text-sm text-ink/65">{status}</p> : null}

      {analytics ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Attributed Orders" value={analytics.attributed_orders} tone="leaf" />
            <MetricCard
              label="Attributed Revenue"
              value={currency.format(analytics.attributed_revenue)}
              tone="coral"
            />
            <MetricCard
              label="Conversion Rate"
              value={`${analytics.conversion_rate.toFixed(1)}%`}
              tone="gold"
            />
            <MetricCard label="Communications Sent" value={analytics.communications_sent} />
          </section>

          <section className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded border border-ink/10 bg-white p-4 shadow-soft">
              <p className="mb-3 text-sm font-semibold text-ink">Engagement Funnel</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dbe7e1" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#2f7d63" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded border border-ink/10 bg-white p-4 shadow-soft">
              <p className="mb-3 text-sm font-semibold text-ink">Performance Metrics</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {performanceMetrics.map(([label, value]) => (
                  <div key={label} className="rounded bg-cloud p-3">
                    <p className="text-xs font-medium text-ink/50">{label}</p>
                    <p className="mt-1 truncate text-lg font-semibold text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </>
  );
}

function percentFrom(numerator: number, denominator: number) {
  return denominator > 0 ? `${((numerator / denominator) * 100).toFixed(1)}%` : "0.0%";
}

function moneyFrom(numerator: number, denominator: number) {
  return denominator > 0 ? currency.format(numerator / denominator) : currency.format(0);
}
