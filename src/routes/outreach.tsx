import { createFileRoute, Outlet } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/outreach")({
  component: OutreachLayout,
});

function OutreachLayout() {
  return <SiteShell>
    <Outlet />
  </SiteShell>;
}
