"use client"

import React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  BarChart3,
  Database,
  TestTube,
  Key,
  ArrowRight,
  Users,
  Activity
} from "lucide-react"

export default function Home() {
  const { user, isAuthenticated } = useAuth()

  const features = [
    {
      title: "Course Performance",
      description: "Monitor performa mata kuliah dan aktivitas mahasiswa",
      href: "/course-performance",
      icon: BarChart3,
      color: "text-blue-600"
    },
    {
      title: "Student Activities",
      description: "Ringkasan aktivitas mahasiswa dengan filtering",
      href: "/student-activities-summary",
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Admin ETL",
      description: "Kelola sinkronisasi data sistem",
      href: "/admin/etl",
      icon: Database,
      color: "text-purple-600",
      adminOnly: true
    },
    {
      title: "API Test",
      description: "Testing endpoint API CeLOE",
      href: "/api-test",
      icon: TestTube,
      color: "text-orange-600",
      adminOnly: true
    },
    {
      title: "Token Generator",
      description: "Generate JWT token untuk development",
      href: "/token-generator",
      icon: Key,
      color: "text-gray-600",
      adminOnly: true
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">MONEV Dashboard</h1>
              <p className="text-gray-600">CeLOE Monitoring & Evaluation System</p>
            </div>
          </div>
          
          <p className="text-lg text-gray-700 max-w-2xl">
            Sistem monitoring dan evaluasi untuk platform CeLOE Telkom University. 
            Analisis real-time performa pembelajaran dan aktivitas mahasiswa.
          </p>
          
          {isAuthenticated && user && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1">
                  <Activity className="w-3 h-3 mr-1" />
                  {user.name}
                </Badge>
                {user.admin && (
                  <Badge className="bg-blue-600 hover:bg-blue-700 px-3 py-1">
                    Admin Access
                  </Badge>
                )}
              </div>
              
              
              {/* User Details from Token */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {user.kampus && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Kampus:</span>
                    <span className="uppercase">{user.kampus}</span>
                  </div>
                )}
                {user.fakultas && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Fakultas:</span>
                    <span className="uppercase">{user.fakultas}</span>
                  </div>
                )}
                {user.prodi && (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Prodi:</span>
                    <span className="capitalize">{user.prodi.replace('-', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
           )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-md transition-all duration-200 border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  {feature.adminOnly && !user?.admin && (
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <Link href={feature.href}>
                  <Button 
                    variant={feature.adminOnly && !user?.admin ? "outline" : "default"}
                    disabled={feature.adminOnly && !user?.admin}
                    className="w-full group-hover:translate-x-1 transition-transform"
                  >
                    {feature.adminOnly && !user?.admin ? "Requires Admin" : "Open"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>
                {user?.admin ? '5' : '4'} Features Available
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>
                {isAuthenticated ? 'Authenticated' : 'Guest Mode'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Telkom University</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}