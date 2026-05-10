import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/focus/stats")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Stats are coming soon!</div>;
}
