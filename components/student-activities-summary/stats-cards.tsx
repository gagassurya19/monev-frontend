"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, School } from "lucide-react";

export type StatsCardsProps = {
  params?: {
    university?: string;
    fakultas_id?: string;
    prodi_id?: string;
    subject_ids?: string;
    date_start?: string;
    date_end?: string;
    show_all?: string; // 'true' to allow fetching without prodi_id
  };
};

type StatsResponse = {
  data: {
    total_activities: number;
    average_score: number;
    active_users: number;
    completion_rate: number; // 0..1
  };
};

export function StatsCards({ params }: StatsCardsProps) {
  const [data, setData] = React.useState<StatsResponse["data"] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [appliedParams, setAppliedParams] = React.useState<StatsCardsProps["params"] | undefined>(undefined);

  const buildQuery = (p: StatsCardsProps["params"]) => {
    const qp = new URLSearchParams();
    if (!p) return "";
    Object.entries(p).forEach(([k, v]) => {
      if (k === 'show_all') return; // do not forward to backend
      if (typeof v === "string" && v) qp.set(k, v);
    });
    return qp.toString() ? `?${qp.toString()}` : "";
  };

  React.useEffect(() => {
    if (!params) return;
    const allow = params.prodi_id || params.show_all === 'true';
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
        setData(json.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [appliedParams]);

  if (!params || (!params.prodi_id && params.show_all !== 'true')) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.total_activities ?? (loading ? '…' : 0)}
              </p>
            </div>
            <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.average_score ?? (loading ? '…' : 0)}
              </p>
            </div>
            <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.active_users ?? (loading ? '…' : 0)}
              </p>
            </div>
            <div className="h-16 w-16 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {data ? Math.round((data.completion_rate || 0) * 100) : (loading ? '…' : 0)}%
              </p>
            </div>
            <div className="h-16 w-16 bg-orange-100 rounded-lg flex items-center justify-center">
              <School className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default StatsCards;


