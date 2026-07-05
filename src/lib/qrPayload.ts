export type QrTab = "url" | "text" | "wifi" | "vcard";

export interface WifiData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "nopass";
  hidden: boolean;
}

export interface VCardData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  organization: string;
  title: string;
  website: string;
}

function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiPayload(data: WifiData): string {
  const { ssid, password, encryption, hidden } = data;
  return `WIFI:T:${encryption};S:${escapeWifi(ssid)};${
    encryption === "nopass" ? "" : `P:${escapeWifi(password)};`
  }H:${hidden ? "true" : "false"};;`;
}

export function buildVCardPayload(data: VCardData): string {
  const { firstName, lastName, phone, email, organization, title, website } = data;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${lastName};${firstName};;;`,
    `FN:${[firstName, lastName].filter(Boolean).join(" ")}`,
  ];
  if (organization) lines.push(`ORG:${organization}`);
  if (title) lines.push(`TITLE:${title}`);
  if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
  if (email) lines.push(`EMAIL:${email}`);
  if (website) lines.push(`URL:${website}`);
  lines.push("END:VCARD");
  return lines.join("\n");
}
