
"use client";

import { useState, useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Shield, LayoutDashboard, Map, Bell, Users, BarChart3, Settings, LogOut, Search, Filter, AlertCircle } from "lucide-react";
import { StatsOverview } from "@/components/admin/stats-overview";
import { MOCK_DISRUPTION_EVENTS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <Sidebar className="border-r border-border/50 bg-card">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-headline font-bold">GigGuard<span className="text-primary">Admin</span></span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive>
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Users className="h-4 w-4" />
                  <span>Worker Management</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <AlertCircle className="h-4 w-4" />
                  <span>Disruption Logs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <BarChart3 className="h-4 w-4" />
                  <span>System Analytics</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Settings className="h-4 w-4" />
                  <span>Platform Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-border/50">
            <Link href="/" className="w-full">
              <SidebarMenuButton className="text-destructive">
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </Link>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold">Admin Central</h1>
              <p className="text-muted-foreground">Platform health and worker protection monitor</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search workers..." className="pl-9 h-9" />
              </div>
            </div>
          </header>

          <StatsOverview />

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-headline font-bold">Active Disruption Events</h2>
              <Link href="/heatmap">
                <Button size="sm" variant="link" className="text-primary font-bold">
                  View Live Map <Map className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/30">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 font-bold uppercase text-xs tracking-wider border-b border-border/50">
                  <tr>
                    <th className="p-4">Location</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Impact (Workers)</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {MOCK_DISRUPTION_EVENTS.map((event) => (
                    <tr key={event.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-medium">{event.locationName}</td>
                      <td className="p-4 text-muted-foreground">{format(new Date(event.timestamp), "MMM dd, HH:mm")}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{event.workersCount}</span>
                          <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${Math.min(100, (event.workersCount / 30) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                          Collecting Data
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary h-8">Resolve</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid md:grid-cols-2 gap-8">
            <div className="p-6 bg-card rounded-xl border border-border/50">
              <h3 className="text-lg font-headline font-bold mb-4">Payout Analysis</h3>
              <div className="h-[200px] flex items-center justify-center border border-dashed border-border/50 rounded-lg text-muted-foreground bg-muted/20">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Payout trends over last 30 days visualization</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-card rounded-xl border border-border/50">
              <h3 className="text-lg font-headline font-bold mb-4">Worker Onboarding</h3>
              <div className="h-[200px] flex items-center justify-center border border-dashed border-border/50 rounded-lg text-muted-foreground bg-muted/20">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">New registration velocity graph</p>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </SidebarProvider>
  );
}
