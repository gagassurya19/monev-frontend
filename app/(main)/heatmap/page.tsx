'use client';

import { Suspense, useState, useEffect } from 'react';
import HeatmapTabs from '@/components/heatmap/heatmap-tabs';
import { HeatmapDisplay } from '@/components/heatmap/heatmap-display';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function HeatmapPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'mahasiswa';
  const startDateParam = searchParams.get('start_date');

  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  useEffect(() => {
    if (startDateParam && !isNaN(new Date(startDateParam).getTime())) {
      setStartDate(new Date(startDateParam));
    }
  }, [startDateParam]);

  const handleYearChange = (newYear: string) => {
    const newDate = new Date(Number(newYear), 0, 1);
    const formattedDate = newDate.toISOString().split('T')[0];
    router.push(`/heatmap?role=${role}&start_date=${formattedDate}`);
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + (direction === 'next' ? 7 : -7));
    const formattedDate = newDate.toISOString().split('T')[0];
    router.push(`/heatmap?role=${role}&start_date=${formattedDate}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const getYears = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear; i++) {
      years.push(i.toString());
    }
    return years.reverse();
  };

  const formattedStartDate = startDate.toISOString().split('T')[0];

  // Validasi role
  if (role !== 'mahasiswa' && role !== 'dosen') {
    router.push(`/heatmap?role=mahasiswa&start_date=${formattedStartDate}`);
    return null;
  }

  return (
    <>
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SidebarTrigger className="-ml-1 block sm:hidden" />
              <Separator orientation="vertical" className="h-4 block sm:hidden" />
              <h1 className="text-lg font-semibold text-gray-900">Moodle Activity</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Select onValueChange={handleYearChange} value={startDate.getFullYear().toString()}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tahun</SelectLabel>
                    {getYears().map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => handleWeekChange('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleWeekChange('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-col items-center justify-center p-4">
        <HeatmapTabs initialRole={role} />
        <Suspense fallback={<div>Loading...</div>}>
          <HeatmapDisplay role={role} startDate={formattedStartDate} />
        </Suspense>
      </div>
    </>
  );
}