import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard#usage", label: "Usage" },
  { href: "/dashboard#api-keys", label: "API Keys" },
  { href: "/dashboard#webhooks", label: "Webhooks" },
  { href: "/dashboard#notifications", label: "Notifications" },
  { href: "/dashboard#claimed-servers", label: "Claimed Servers" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex gap-8">
      <aside className="hidden md:block w-48 shrink-0">
        <nav className="sticky top-24 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]/50 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
