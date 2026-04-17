"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

type TooltipPayloadEntry = {
  value?: number | string | readonly (number | string)[];
  name?: string | number;
  color?: string;
  fill?: string;
  payload?: Record<string, unknown>;
};

type TooltipContentArgs = {
  active?: boolean;
  payload?: readonly TooltipPayloadEntry[];
  label?: string | number;
};

// ── Revenue Area Chart ──
export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.4} vertical={false} />
        <XAxis
          dataKey="month"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888", fontSize: 12 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888", fontSize: 11 }}
          tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
          width={55}
        />
        <Tooltip
          content={({ active, payload, label }: TooltipContentArgs) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-xl shadow-black/20">
                <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-bold text-amber-400">
                  ₱{Number(payload[0].value).toLocaleString()}
                </p>
              </div>
            );
          }}
          cursor={{ stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "4 4" }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#f59e0b"
          strokeWidth={2.5}
          fill="url(#revenueGradient)"
          dot={{ fill: "#1a1a2e", stroke: "#f59e0b", strokeWidth: 2.5, r: 4 }}
          activeDot={{
            r: 7,
            fill: "#f59e0b",
            stroke: "#1a1a2e",
            strokeWidth: 3,
            className: "drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]",
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── JO Status Pie Chart ──
export function JOStatusChart({
  data,
}: {
  data: { status: string; count: number; color: string }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={3}
          dataKey="count"
          nameKey="status"
          strokeWidth={0}
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color}
              className="transition-opacity duration-200 hover:opacity-80"
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }: TooltipContentArgs) => {
            if (!active || !payload?.length) return null;
            const item = payload[0];
            const value = Number(item.value ?? 0);
            const pct = ((value / total) * 100).toFixed(1);
            const itemColor = item.payload?.color as string | undefined;
            return (
              <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-xl shadow-black/20">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: itemColor }}
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {item.name}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground pl-[18px]">
                  {value.toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({pct}%)
                  </span>
                </p>
              </div>
            );
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value: string) => (
            <span className="text-xs text-[#999]">{value}</span>
          )}
          wrapperStyle={{ paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Low Stock Bar Chart ──
export function LowStockChart({
  data,
}: {
  data: { name: string; stock: number; critical: number }[];
}) {
  const chartData = data.slice(0, 6).map((d) => ({
    ...d,
    shortName: d.name.length > 18 ? d.name.substring(0, 18) + "…" : d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        barGap={2}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          horizontal={false}
          stroke="#333"
          opacity={0.4}
        />
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888", fontSize: 11 }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="shortName"
          width={130}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#999", fontSize: 11 }}
        />
        <Tooltip
          content={({ active, payload }: TooltipContentArgs) => {
            if (!active || !payload?.length) return null;
            const item = payload[0]?.payload as
              | { name?: string; stock?: number; critical?: number }
              | undefined;
            return (
              <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-xl shadow-black/20 max-w-[220px]">
                <p className="text-xs font-semibold text-foreground mb-1 truncate">
                  {item?.name}
                </p>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">Stock:</span>
                  <span className="text-xs font-bold text-red-400">
                    {item?.stock}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0 opacity-50" />
                  <span className="text-xs text-muted-foreground">
                    Critical:
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    {item?.critical}
                  </span>
                </div>
              </div>
            );
          }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar
          dataKey="stock"
          name="Current Stock"
          fill="#ef4444"
          radius={[0, 4, 4, 0]}
          barSize={14}
        />
        <Bar
          dataKey="critical"
          name="Critical Level"
          fill="#f59e0b"
          radius={[0, 4, 4, 0]}
          barSize={14}
          opacity={0.4}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Top Brands Bar Chart ──
export function TopBrandsChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  const COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6", "#ec4899"];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#333"
          opacity={0.4}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#999", fontSize: 11 }}
          dy={5}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#888", fontSize: 11 }}
          width={35}
        />
        <Tooltip
          content={({ active, payload, label }: TooltipContentArgs) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="rounded-lg border border-border bg-popover px-3 py-2.5 shadow-xl shadow-black/20">
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  {label}
                </p>
                <p className="text-sm font-bold" style={{ color: payload[0].fill }}>
                  {Number(payload[0].value ?? 0).toLocaleString()}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    parts
                  </span>
                </p>
              </div>
            );
          }}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Bar dataKey="count" name="Parts" radius={[6, 6, 0, 0]} barSize={40}>
          {data.map((_, i) => (
            <Cell key={`cell-${i}`} fill={COLORS[i % 5]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
