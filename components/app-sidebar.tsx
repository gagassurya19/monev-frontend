"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  BarChart3,
  Home,
  LogOut,
  User,
  Database,
  School,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { JWTAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Menu items
const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Course Performance",
      url: "/course-performance",
      icon: School,
      isActive: true,
    },
    {
      title: "Student Activities Summary",
      url: "/student-activities-summary",
      icon: BarChart3,
    },
    {
      title: "Student Performance",
      url: "/student-performance",
      icon: Users,
    },
  ],
};

// Token Time Remaining Component
const TokenTimeRemaining: React.FC = () => {
  const { token } = useAuth();
  const [timeLeft, setTimeLeft] = React.useState<number>(0);

  React.useEffect(() => {
    if (!token) return;

    const updateTimeLeft = () => {
      const remaining = JWTAuth.getTimeUntilExpiry(token);
      setTimeLeft(remaining);
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [token]);

  const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "Expired";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <span className="truncate text-xs text-muted-foreground">
      Expired in {formatTime(timeLeft)}
    </span>
  );
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { setOpen, isMobile } = useSidebar();

  const handleLogout = () => {
    signOut();
  };

  // Add admin page for admin users
  const getNavItems = () => {
    const baseItems = data.navMain;

    if (user?.admin) {
      return [
        ...baseItems,
        {
          title: "Admin",
          url: "/admin",
          icon: Database,
        },
      ];
    }

    return baseItems;
  };

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mb-2 flex items-center justify-start"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-primary-foreground">
                <BookOpen className="h-5 w-5" strokeWidth={3} />
              </div>
              <div className="flex flex-col flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden justify-center">
                <span className="truncate font-semibold text-sm">MONEV</span>
                <span className="truncate text-xs text-muted-foreground">
                  CeLOE Monitoring System
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel className="flex items-center">Main Navigation</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {getNavItems().map((item) => (
                <SidebarMenuItem
                  key={item.title}
                  className="group-data-[collapsible=icon]:my-3"
                >
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                    className="flex items-center justify-start h-10 group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                    >
                      <div className="flex items-center justify-center h-9 w-9 rounded-md group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-hover:bg-sidebar-accent/50">
                        <item.icon
                          className="!h-6 !w-6 flex-shrink-0"
                          strokeWidth={2}
                        />
                      </div>
                      <span className="text-sm font-medium leading-none">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* User Profile Section */}
          <SidebarMenuItem>
            <div className="flex items-center gap-3 rounded-md hover:bg-sidebar-accent/50 transition-colors duration-200 min-h-[44px]">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="flex items-center justify-center">
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate max-w-[150px] font-semibold text-sm">
                  {user?.name || "null"}
                </span>
                <TokenTimeRemaining />
              </div>
            </div>
          </SidebarMenuItem>

          {/* Logout Button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 flex items-center justify-start h-10 gap-3"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarSeparator className="my-1" />
          <SidebarMenuItem>
            <SidebarTrigger showCloseText={true} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
