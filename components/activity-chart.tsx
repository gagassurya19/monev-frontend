'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip, Cell } from 'recharts'
import { ChartContainer, ChartConfig } from '@/components/ui/chart'

// Type definitions for the chart data
export interface ActivityData {
  category: string
  Quiz: number
  Assignment: number
  Video: number
  Forum: number
  URL: number
}

export interface ActivityChartProps {
  data: ActivityData[]
  title?: string
  subtitle?: string
  height?: number
  className?: string
}

// Chart configuration with colors matching the image
const chartConfig: ChartConfig = {
  Quiz: {
    label: 'Quiz',
    color: '#1e3a8a', // Dark blue
  },
  Assignment: {
    label: 'Assignment', 
    color: '#ea580c', // Orange
  },
  Video: {
    label: 'Video',
    color: '#16a34a', // Green
  },
  Forum: {
    label: 'Forum',
    color: '#0ea5e9', // Light blue
  },
  URL: {
    label: 'URL',
    color: '#9333ea', // Purple
  },
} satisfies ChartConfig

// Custom legend component to match the design
const CustomLegend = (props: any) => {
  const { payload } = props
  
  return (
    <div className="flex justify-center items-center gap-6 mt-4 text-sm">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600 font-medium">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// Custom tooltip component to show data values
const CustomTooltip = (props: any) => {
  const { active, payload, label } = props

  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800 mb-2">{`Kategori: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.dataKey}:</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {entry.value.toFixed(1)} aktivitas
            </span>
          </div>
        ))}
      </div>
    )
  }

  return null
}

export function ActivityChart({ 
  data, 
  title = "LVL 0", 
  subtitle,
  height = 400,
  className = ""
}: ActivityChartProps) {
  return (
    <div className={`w-full bg-white rounded-lg border border-gray-200 p-6 ${className} chart-container`}>
      <style>{`
        .chart-container * {
          filter: none !important;
          opacity: 1 !important;
          fill-opacity: 1 !important;
        }
        .chart-container .recharts-bar-rectangle {
          transition: box-shadow 0.2s ease !important;
        }
        .chart-container .recharts-bar-rectangle:hover {
          box-shadow: inset 0 0 0 2px #374151 !important;
          filter: none !important;
          opacity: 1 !important;
          fill-opacity: 1 !important;
        }
        .chart-container .recharts-tooltip-cursor,
        .chart-container .recharts-active-bar,
        .chart-container .recharts-active-shape {
          display: none !important;
        }
      `}</style>
      {/* Chart Title */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 bg-gray-100 inline-block px-4 py-2 rounded-lg">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-2 font-medium">
            {subtitle}
          </p>
        )}
      </div>

      {/* Chart Container */}
      <ChartContainer config={chartConfig} className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 80, // Extra space for legend
            }}
            barCategoryGap="20%"
            style={{ cursor: 'pointer' }}
            onMouseMove={() => {}}
            onMouseLeave={() => {}}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis 
              dataKey="category"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 14, 
                fontWeight: 600,
                fill: '#374151'
              }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: 12,
                fill: '#6b7280'
              }}
              domain={[0, 6]}
              ticks={[0, 1, 2, 3, 4, 5, 6]}
            />
            
            {/* Bars for each activity type */}
            <Bar 
              dataKey="Quiz" 
              fill="var(--color-Quiz)"
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Bar 
              dataKey="Assignment" 
              fill="var(--color-Assignment)"
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Bar 
              dataKey="Video" 
              fill="var(--color-Video)"
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Bar 
              dataKey="Forum" 
              fill="var(--color-Forum)"
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Bar 
              dataKey="URL" 
              fill="var(--color-URL)"
              radius={[2, 2, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              content={<CustomLegend />}
              wrapperStyle={{
                paddingTop: '20px'
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

// Sample data generator for testing
export const generateSampleData = (): ActivityData[] => [
  {
    category: 'FIF',
    Quiz: 4.3,
    Assignment: 2.4,
    Video: 2.0,
    Forum: 1.1,
    URL: 2.2,
  },
  {
    category: 'TUP',
    Quiz: 2.5,
    Assignment: 4.4,
    Video: 2.0,
    Forum: 3.1,
    URL: 3.3,
  },
  {
    category: 'TUS',
    Quiz: 3.5,
    Assignment: 1.8,
    Video: 3.0,
    Forum: 2.5,
    URL: 1.1,
  },
  {
    category: 'TUJ',
    Quiz: 4.5,
    Assignment: 2.8,
    Video: 5.0,
    Forum: 4.1,
    URL: 1.5,
  },
] 