export type StoredCampaign = {
  id: string;
  name: string;
  audience?: number;
  status: "created" | "previewed" | "launched";
  updatedAt: string;
};

const STORAGE_KEY = "sonariq:campaigns";

export function readStoredCampaigns(): StoredCampaign[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function upsertStoredCampaign(campaign: StoredCampaign) {
  if (typeof window === "undefined") {
    return;
  }

  const campaigns = readStoredCampaigns();
  const nextCampaigns = [
    campaign,
    ...campaigns.filter((item) => item.id !== campaign.id),
  ].slice(0, 12);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCampaigns));
}
