"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

export type DistributionPieProps = {
  params?: {
    university?: string;
    fakultas_id?: string;
    prodi_id?: string;
    subject_ids?: string;
    date_start?: string;
    date_end?: string;
    show_all?: string; // 'true' to allow fetching without prodi_id
  };
  className?: string;
};

type StatsResponse = {
  data: {
    distribution?: {
      file?: number;
      video?: number;
      forum?: number;
      quiz?: number;
      assignment?: number;
      url?: number;
    };
  };
};

const SLICE_COLORS: Record<string, string> = {
  file: "#475569", // slate
  video: "#16a34a", // green
  forum: "#0ea5e9", // sky
  quiz: "#1e3a8a", // blue-900
  assignment: "#ea580c", // orange-600
  url: "#9333ea", // purple-600
};

export function DistributionPie({ params, className }: DistributionPieProps) {
  const [appliedParams, setAppliedParams] = React.useState<DistributionPieProps["params"] | undefined>(undefined);
  const [data, setData] = React.useState<Array<{ name: string; value: number; color: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  const buildQuery = (p: DistributionPieProps["params"]) => {
    const qp = new URLSearchParams();
    if (!p) return "";
    Object.entries(p).forEach(([k, v]) => {
      if (k === "show_all") return; // do not forward to backend
      if (typeof v === "string" && v) qp.set(k, v);
    });
    return qp.toString() ? `?${qp.toString()}` : "";
  };

  React.useEffect(() => {
    if (!params) return;
    const allow = params.prodi_id || params.show_all === "true";
    if (!allow) return;
    setAppliedParams(params);
  }, [params]);

  React.useEffect(() => {
    (async () => {
      if (!appliedParams) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/sas/summary/stats${buildQuery(appliedParams)}`);
        const json: StatsResponse = await res.json();
        const dist = json?.data?.distribution || {};
        const entries = Object.entries(dist)
          .filter(([, v]) => typeof v === "number")
          .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v as number, color: SLICE_COLORS[k] || "#999" }));
        setData(entries);
      } catch {
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [appliedParams]);

  if (!params || (!params.prodi_id && params.show_all !== "true")) return null;

  return (
    <div className={className}>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, _name: any, payload: any) => [value, payload?.payload?.name || "Activities"]}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {loading && (
        <div className="mt-2 text-center text-xs text-gray-500">Loading...</div>
      )}
    </div>
  );
}

export default DistributionPie;


