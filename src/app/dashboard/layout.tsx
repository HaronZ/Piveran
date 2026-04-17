import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userName =
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "User";
  const userRole = user?.user_metadata?.role || "Staff";
  const userEmail = user?.email || "";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        userName={userName}
        userRole={userRole}
        userInitials={userInitials}
      />
      {/* Main content area — full width on mobile, offset by sidebar on desktop */}
      <main className="flex-1 lg:ml-[260px] transition-all duration-300 ease-in-out">
        <div className="p-4 pt-16 lg:pt-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
