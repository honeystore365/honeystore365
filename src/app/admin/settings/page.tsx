import { getSettings } from "@/lib/db";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const row = await getSettings();
  const settings = Array.isArray(row) ? row[0] : row;

  return (
    <SettingsClient initialSettings={settings} />
  );
}
