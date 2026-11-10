"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AnalyticsData } from "./page";

const DEVICE_COLORS = ["#1c4874", "#2d7a52", "#a6aec5", "#990000"];

export function VisitorsChart({
  dailyVisitors,
}: {
  dailyVisitors: AnalyticsData["dailyVisitors"];
}) {
  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={dailyVisitors}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="visitors"
          name="Visitors"
          stroke="#1c4874"
          strokeWidth={3}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="pageViews"
          name="Page Views"
          stroke="#2d7a52"
          strokeWidth={3}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function DeviceChart({
  deviceBreakdown,
}: {
  deviceBreakdown: AnalyticsData["deviceBreakdown"];
}) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={deviceBreakdown}
          dataKey="count"
          nameKey="device"
          cx="50%"
          cy="50%"
          outerRadius={85}
          innerRadius={50}
        >
          {deviceBreakdown.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EventsChart({
  topEvents,
}: {
  topEvents: AnalyticsData["topEvents"];
}) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={topEvents} layout="vertical" margin={{ left: 30, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="event" width={120} />
        <Tooltip />
        <Bar dataKey="count" name="Events" fill="#1c4874" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}