import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "../../components/settings/Settings";

export const Route = createFileRoute("/_auth/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return <Settings />;
} 