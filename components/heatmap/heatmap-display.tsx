'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HeatmapDisplayProps {
  role: string;
  startDate: string;
}

type HeatmapGrid = number[][];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api/v1';
const DAYS_ID = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const COLOR_PALETTE = ['#ececef', '#d2dcff', '#7992f5', '#4e65cd', '#303470'];

const getColor = (value: number, maxAccess: number): string => {
  if (value === 0) return '#f0f0f0';
  const normalizedValue = maxAccess > 0 ? value / maxAccess : 0;
  const colorIndex = Math.floor(normalizedValue * (COLOR_PALETTE.length - 1));
  return COLOR_PALETTE[colorIndex];
};

const getWeekDays = (startDate: string) => {
  const dates = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay() + 1);
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dayName = DAYS_ID[i];
    dates.push(`${dayName}, ${currentDate.getDate()}/${currentDate.getMonth() + 1}`);
  }
  return dates;
};

export function HeatmapDisplay({ role, startDate }: HeatmapDisplayProps) {
  const [data, setData] = useState<HeatmapGrid>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (!token) {
        setError('Authentication token not found.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/heatmap?role=${role}&start_date=${startDate}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data: ${response.statusText} (${response.status})`);
        }

        const jsonData = await response.json();
        if (!jsonData.data) {
          throw new Error('No data returned from API');
        }

        setData(jsonData.data);
      } catch (e: any) {
        console.error('Error fetching data:', e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [role, token, startDate]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Aktivitas {role === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="w-full h-[400px]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  const weekDays = getWeekDays(startDate);
  const maxAccess = Math.max(...data.flat());

  const getRangeText = (index: number, totalRanges: number, maxVal: number) => {
    const step = maxVal / totalRanges;
    const start = Math.floor(index * step);
    const end = Math.floor((index + 1) * step) - (index === totalRanges - 1 ? 0 : 1);
    return `${start} - ${end} logins`;
  };

  const legendRanges = COLOR_PALETTE.length;

  const formatDateToIndonesian = (dateStr: string) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const calculateEndDate = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end.toISOString().split('T')[0];
  };

  const endDate = calculateEndDate(startDate);
  const formattedStartDate = formatDateToIndonesian(startDate);
  const formattedEndDate = formatDateToIndonesian(endDate); 

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle>Aktivitas {role === 'mahasiswa' ? 'Mahasiswa' : 'Dosen'}</CardTitle>
        <CardDescription>Intensitas login berdasarkan hari dan jam untuk minggu mulai dari {formattedStartDate} - {formattedEndDate}.</CardDescription>
      </CardHeader>
      <CardContent className="px-15">
        <div className="flex">
          <div className="flex flex-col justify-around text-xs md:text-sm mr-2 text-right">
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className="h-8">
                {i.toString().padStart(2, '0')}:00
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-grow">
            {data.length > 0 &&
              data[0]?.length > 0 &&
              data.map((row, hourIndex) => (
                row.map((value, dayIndex) => (
                  <TooltipProvider key={`${hourIndex}-${dayIndex}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="w-full h-8 rounded-sm"
                          style={{ backgroundColor: getColor(value, maxAccess) }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {value} logins pada {weekDays[dayIndex]} jam {hourIndex}:00
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))
              ))}
          </div>
        </div>
        <div className="flex justify-around mt-2 text-xs">
          {weekDays.map((date, index) => (
            <span key={index} className="w-full text-center">{date}</span>
          ))}
        </div>
        <div className="mt-8">
          <TooltipProvider>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm">Rendah</span>
              <div className="flex flex-grow max-w-xs h-6 rounded-md overflow-hidden">
                {COLOR_PALETTE.map((color, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 h-full cursor-pointer" style={{ backgroundColor: color }} />
                    </TooltipTrigger>
                    <TooltipContent>{getRangeText(index, legendRanges, maxAccess)}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
              <span className="text-sm">Tinggi</span>
            </div>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}