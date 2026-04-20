import { Suspense } from "react";
import Link from "next/link";
import {
  Package,
  DollarSign,
  TrendingUp,
  Wrench,
  Users,
  Car,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  AlertTriangle,
  Activity,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/lib/db/queries/dashboard";
import { getCurrentUserDisplayName } from "@/lib/auth/actions";
import {
  RevenueChart,
  JOStatusChart,
  LowStockChart,
  TopBrandsChart,
} from "@/components/dashboard-charts";

// ── Currency formatter ──
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ── KPI Stat Card ──
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: "up" | "down";
  trendValue?: string;
  variant?: "default" | "primary" | "success" | "warning";
  href?: string;
}) {
  const iconColors = {
    default: "bg-muted/50 text-muted-foreground",
    primary: "bg-amber-500/10 text-amber-500",
    success: "bg-emerald-500/10 text-emerald-500",
    warning: "bg-red-500/10 text-red-500",
  };

  const cardContent = (
    <Card className={`group relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-md transition-all duration-300 hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-500/5 ${href ? "cursor-pointer" : ""}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative">
        <CardTitle className="text-[13px] font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconColors[variant]} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-[26px] font-bold tracking-tight leading-tight">
          {value}
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {trend && (
            <Badge
              variant="secondary"
              className={`gap-0.5 text-[10px] font-semibold px-1.5 py-0 ${
                trend === "up"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trendValue}
            </Badge>
          )}
          <p className="text-[11px] text-muted-foreground leading-snug">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href} className="block">{cardContent}</Link>;
  }
  return cardContent;
}

// ── Quick Action Card ──
function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border/40 bg-card/60 p-4 backdrop-blur-md transition-all duration-300 hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {description}
        </p>
      </div>
    </a>
  );
}

// ── Greeting ──
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ── MAIN PAGE ──
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* ─── Page Header — renders INSTANTLY ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {getGreeting()},{" "}
            <Suspense
              fallback={
                <span className="inline-block h-7 w-32 rounded bg-muted/40 align-middle animate-pulse" />
              }
            >
              <UserNameGradient />
            </Suspense>{" "}
            👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s your business overview at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span>
            Updated{" "}
            {new Date().toLocaleTimeString("en-PH", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
      </div>

      {/* ─── Data Section — streams in via Suspense ─── */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

async function UserNameGradient() {
  const name = await getCurrentUserDisplayName();
  return (
    <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
      {name}
    </span>
  );
}

// ── Loading Skeleton ──
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-3 w-24 rounded bg-muted/40" />
              <div className="h-10 w-10 rounded-xl bg-muted/30" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-32 rounded bg-muted/40 mb-2" />
              <div className="h-3 w-20 rounded bg-muted/30" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="h-3 w-24 rounded bg-muted/40" />
              <div className="h-10 w-10 rounded-xl bg-muted/30" />
            </CardHeader>
            <CardContent>
              <div className="h-7 w-32 rounded bg-muted/40 mb-2" />
              <div className="h-3 w-20 rounded bg-muted/30" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md h-[340px]" />
        <Card className="border-border/40 bg-card/60 backdrop-blur-md h-[340px]" />
      </div>
    </div>
  );
}

// ── Async Data Content ──
async function DashboardContent() {
  const data = await getDashboardData();

  const lowStockCount = data.lowStockParts.length;
  const topLowStock = data.lowStockParts.slice(0, 3);

  return (
    <>
      {/* ─── KPI Cards Row 1 ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          description="All-time from JO payments"
          icon={DollarSign}
          variant="success"
          href="/dashboard/income-statement"
        />
        <StatCard
          title="Active Job Orders"
          value={data.activeJOs.toLocaleString()}
          description={`${data.pendingPaymentJOs} pending payment`}
          icon={Wrench}
          variant="primary"
          href="/dashboard/job-orders"
        />
        <StatCard
          title="Parts Catalog"
          value={data.totalParts.toLocaleString()}
          description={
            lowStockCount > 0
              ? `${lowStockCount} below critical`
              : "All stock healthy"
          }
          icon={Package}
          trend={lowStockCount > 0 ? "down" : undefined}
          trendValue={lowStockCount > 0 ? `${lowStockCount}` : undefined}
          variant={lowStockCount > 0 ? "warning" : "default"}
          href="/dashboard/parts"
        />
        <StatCard
          title="Pending PRs"
          value={data.pendingPRs.toLocaleString()}
          description={`${data.waitingDeliveryPRs} awaiting delivery`}
          icon={ShoppingCart}
          variant="default"
          href="/dashboard/purchase-requests"
        />
      </div>

      {/* ─── KPI Cards Row 2 ─── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Customers"
          value={data.totalCustomers.toLocaleString()}
          description={`${data.totalVendors} vendors`}
          icon={Users}
          variant="primary"
          href="/dashboard/customers"
        />
        <StatCard
          title="Total Job Orders"
          value={data.totalJOs.toLocaleString()}
          description={`${data.completedJOs} completed`}
          icon={BarChart3}
          variant="default"
          href="/dashboard/job-orders"
        />
        <StatCard
          title="Cars Serviced"
          value={data.totalCars.toLocaleString()}
          description="Unique vehicles"
          icon={Car}
          variant="primary"
          href="/dashboard/cars"
        />
        <StatCard
          title="Inventory Value"
          value={
            data.inventoryCurrentValue
              ? formatCurrency(data.inventoryCurrentValue)
              : "—"
          }
          description={
            data.inventoryValueDate
              ? `As of ${data.inventoryValueDate}`
              : "No valuation data"
          }
          icon={TrendingUp}
          variant="success"
          href="/dashboard/parts"
        />
      </div>

      {/* ─── Charts Row ─── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Revenue Trend
                </CardTitle>
                <CardDescription className="text-xs">
                  Monthly revenue from JO payments
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-500">
                  {formatCurrencyFull(data.totalRevenue)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  all-time total
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {data.monthlyRevenue.length > 0 ? (
              <RevenueChart data={data.monthlyRevenue} />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Job Order Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Distribution across all statuses
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">
                  {data.totalJOs.toLocaleString()}
                </p>
                <p className="text-[10px] text-muted-foreground">total JOs</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {data.joStatusBreakdown.length > 0 ? (
              <JOStatusChart data={data.joStatusBreakdown} />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No job order data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Bottom Row: Low Stock + Quick Actions + Alerts ─── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-md lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  Low Stock Alert
                  {lowStockCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]"
                    >
                      {lowStockCount} items
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-xs">
                  Parts at or below critical stock level
                </CardDescription>
              </div>
              {topLowStock.length > 0 && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs font-medium">Needs attention</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {data.lowStockParts.length > 0 ? (
              <LowStockChart data={data.lowStockParts} />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                All parts above critical levels 🎉
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickAction
                title="Add New Part"
                description="Add to inventory"
                href="/dashboard/parts?action=new"
                icon={Package}
                color="bg-amber-500/10 text-amber-500"
              />
              <QuickAction
                title="Create Purchase Request"
                description="Order from vendors"
                href="/dashboard/purchase-requests?action=new"
                icon={ShoppingCart}
                color="bg-purple-500/10 text-purple-500"
              />
              <QuickAction
                title="Record Stock Movement"
                description="Log in/out"
                href="/dashboard/stock-log?action=new"
                icon={Activity}
                color="bg-emerald-500/10 text-emerald-500"
              />
              <QuickAction
                title="View Job Orders"
                description="Manage JOs"
                href="/dashboard/job-orders"
                icon={Wrench}
                color="bg-blue-500/10 text-blue-500"
              />
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Alerts
                {(lowStockCount > 0 || data.waitingDeliveryPRNames.length > 0) && (
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lowStockCount > 0 && (
                <Link
                  href="/dashboard/parts"
                  className="block group"
                >
                  <Card className="border-red-500/20 bg-red-500/5 transition-all hover:bg-red-500/10 hover:border-red-500/40">
                    <CardContent className="flex items-start gap-3 p-4">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {lowStockCount} Low Stock Item{lowStockCount > 1 ? "s" : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                          {topLowStock.map((p) => p.name).join(", ")}
                          {lowStockCount > 3 && ` +${lowStockCount - 3} more`}
                        </p>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-red-500/60 transition-transform group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              {data.waitingDeliveryPRNames.length > 0 && (
                <Link
                  href="/dashboard/purchase-requests"
                  className="block group"
                >
                  <Card className="border-amber-500/20 bg-amber-500/5 transition-all hover:bg-amber-500/10 hover:border-amber-500/40">
                    <CardContent className="flex items-start gap-3 p-4">
                      <ShoppingCart className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {data.waitingDeliveryPRNames.length} PR
                          {data.waitingDeliveryPRNames.length > 1 ? "s" : ""}{" "}
                          Awaiting Delivery
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                          {data.waitingDeliveryPRNames.join(", ")}
                        </p>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/60 transition-transform group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              {data.pendingPaymentJOs > 0 && (
                <Link
                  href="/dashboard/job-orders"
                  className="block group"
                >
                  <Card className="border-blue-500/20 bg-blue-500/5 transition-all hover:bg-blue-500/10 hover:border-blue-500/40">
                    <CardContent className="flex items-start gap-3 p-4">
                      <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">
                          {data.pendingPaymentJOs} Pending Payment
                          {data.pendingPaymentJOs > 1 ? "s" : ""}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          Job orders waiting for payment.
                        </p>
                      </div>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-500/60 transition-transform group-hover:translate-x-0.5" />
                    </CardContent>
                  </Card>
                </Link>
              )}
              {lowStockCount === 0 &&
                data.waitingDeliveryPRNames.length === 0 &&
                data.pendingPaymentJOs === 0 && (
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="flex items-start gap-3 p-4">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-sm font-semibold">All Clear!</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Everything is running smoothly.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
