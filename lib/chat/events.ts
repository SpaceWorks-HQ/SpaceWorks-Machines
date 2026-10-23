/** Staff alerts a chat channel can receive. Client-safe. Later phases add job, payment and maintenance events. */
export const CHAT_EVENTS = ["join-request", "member-joined", "member-left", "consumable-low-stock"] as const;
export type ChatEvent = (typeof CHAT_EVENTS)[number];

export const CHAT_EVENT_LABELS: Record<ChatEvent, string> = {
  "join-request": "A maker asked to join",
  "member-joined": "A maker joined",
  "member-left": "A maker left",
  "consumable-low-stock": "A consumable is running low",
};

export const CHAT_KINDS = ["SLACK", "DISCORD", "MATTERMOST", "TELEGRAM", "WHATSAPP"] as const;
export type ChatKind = (typeof CHAT_KINDS)[number];

export const CHAT_KIND_LABELS: Record<ChatKind, string> = {
  SLACK: "Slack",
  DISCORD: "Discord",
  MATTERMOST: "Mattermost",
  TELEGRAM: "Telegram",
  WHATSAPP: "WhatsApp",
};

/** The WhatsApp message template spaces create and get approved in Meta's WhatsApp Manager. */
export const WHATSAPP_TEMPLATE = { name: "team_alert", language: "en", body: "{{1}}" } as const;
