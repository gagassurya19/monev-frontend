'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

interface HeatmapTabsProps {
  initialRole: string;
}

export default function HeatmapTabs({ initialRole }: HeatmapTabsProps) {
  const router = useRouter();

  const validRole = initialRole === 'mahasiswa' || initialRole === 'dosen' ? initialRole : 'mahasiswa';

  const handleTabChange = (newRole: string) => {
    router.push(`/heatmap?role=${newRole}`);
  };

  return (
    <Tabs value={validRole} onValueChange={handleTabChange}>
      <TabsList className="mb-4">
        <TabsTrigger value="mahasiswa">Mahasiswa</TabsTrigger>
        <TabsTrigger value="dosen">Dosen</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}