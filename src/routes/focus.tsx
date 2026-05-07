import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ChartColumnBig, ScrollText, Timer } from "lucide-react";

export const Route = createFileRoute("/focus")({
  component: RouteComponent,
});

function RouteComponent() {
  const links = [
    {
      to: "/focus/history",
      icon: ScrollText,
    },
    {
      to: "/focus",
      icon: Timer,
    },
    {
      to: "..",
      icon: ChartColumnBig,
    },
  ];

  return (
    <div className="relative flex min-h-[100dvh] flex-col">
      {/* Navigation Bar: Bottom on Mobile, Top on Desktop */}
      <header className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center  bg-background/80 p-3 backdrop-blur-md md:sticky md:top-0  ">
        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            {links.map((link) => (
              <NavigationMenuItem key={link.to}>
                <Link to={link.to}>
                  <NavigationMenuLink className="size-14 ">
                    <link.icon className="mx-auto" />
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
