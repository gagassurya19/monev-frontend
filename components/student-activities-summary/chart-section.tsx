"use client";

import React from "react";
import { ActivityChart, ActivityData } from "@/components/activity-chart";

export type ChartSectionProps = {
  title?: string;
  subtitle?: string;
  params?: {
    university?: string;
    fakultas_id?: string;
    prodi_id?: string;
    subject_ids?: string; // comma-separated
    date_start?: string;
    date_end?: string;
    group_by?: "kampus" | "fakultas" | "prodi" | "subject";
    show_all?: string; // 'true' to allow fetching without prodi_id
  };
  className?: string;
};

type ApiChartItem = {
  category: string;
  file: number;
  video: number;
  forum: number;
  quiz: number;
  assignment: number;
  url: number;
};

export function ChartSection({ title, subtitle, params, className }: ChartSectionProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState<ActivityData[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [appliedParams, setAppliedParams] = React.useState<ChartSectionProps["params"] | undefined>(undefined);

  const buildQuery = (p: ChartSectionProps["params"]) => {
    const qp = new URLSearchParams();
    if (!p) return "";
    Object.entries(p).forEach(([k, v]) => {
      if (k === 'show_all') return; // do not forward to backend
      if (typeof v === "string" && v) qp.set(k, v);
    });
    return qp.toString() ? `?${qp.toString()}` : "";
  };

  const fetchChart = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/sas/summary/chart${buildQuery(params)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: { data: ApiChartItem[] } = await res.json();
      const transformed: ActivityData[] = json.data.map((row) => ({
        category: row.category,
        Quiz: row.quiz,
        Assignment: row.assignment,
        Video: row.video,
        Forum: row.forum,
        URL: row.url,
      }));
      setData(transformed);
    } catch (e: any) {
      setError(e?.message || "Failed to load chart");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  React.useEffect(() => {
    if (!params) return;
    const allow = params.prodi_id || params.show_all === 'true';
    if (!allow) return;
    setAppliedParams(params);
  }, [params]);

  React.useEffect(() => {
    if (!appliedParams) return;
    fetchChart();
  }, [appliedParams, fetchChart]);

  if (error) {
    return (
      <div className={`w-full bg-white rounded-lg border border-red-200 p-4 ${className || ""}`}>
        <div className="text-red-700 text-sm">{error}</div>
      </div>
    );
  }

  if (!params || (!params.prodi_id && params.show_all !== 'true')) return null;

  return (
    <div className={className}>
      <ActivityChart data={data} title={title} subtitle={subtitle} />
      {isLoading && (
        <div className="mt-2 text-xs text-gray-500">Loading chart...</div>
      )}
    </div>
  );
}

export default ChartSection;


