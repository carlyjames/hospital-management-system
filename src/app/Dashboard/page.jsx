"use client";

import React, { useEffect, useState, useRef } from "react";
import PageContainer from "../../components/Layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent } from "../../components/ui/tabs";
import { Plus, Calendar, Server } from "lucide-react";
import { Badge } from "../../components/ui/badge";

import PatientsIcon from "../../assets/images/PatientsIcon.png";
import DeliveriesIcon from "../../assets/images/DeliveriesIcon.png";
import AppointmentsIcon from "../../assets/images/AppointmentsIcon.png";
import Image from "next/image";
import Link from "next/link";

import { useDoctor } from "@/hooks/useDoctor";
import { usePatient } from "@/hooks/usePatient";

const MetricSkeleton = () => (
  <Card>
    <div className="animate-pulse">
      <div className="p-2 m-2">
        <div className="h-8 w-8 rounded-full bg-gray-200" />
      </div>
      <CardHeader className="pb-2">
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-16 bg-gray-200 rounded" />
      </CardContent>
    </div>
  </Card>
);

// ----------------- GET METRICS BY ROLE -----------------
const getMetricsByRole = (role, adminMetrics = {}, patientMetrics = {}) => {
  if (role === "DOCTOR") {
    return [
      { 
        title: "Patients", 
        count: adminMetrics.total_patients || 0, 
        icon: PatientsIcon, 
        bg: "bg-blue-50" 
      },
      { 
        title: "Appointments", 
        count: adminMetrics.total_appointments || 0, 
        icon: AppointmentsIcon, 
        bg: "bg-purple-100" 
      },
      { 
        title: "Deliveries", 
        count: adminMetrics.total_deliveries || 0, 
        icon: DeliveriesIcon, 
        bg: "bg-green-100" 
      },
    ];
  }

  if (role === "PATIENT") {
    return [
      { 
        title: "My Appointments", 
        count: patientMetrics.total_appointments || 0, 
        icon: AppointmentsIcon, 
        bg: "bg-purple-100" 
      },
      { 
        title: "My Deliveries", 
        count: patientMetrics.total_deliveries || 0, 
        icon: DeliveriesIcon, 
        bg: "bg-green-100" 
      },
    ];
  }

  return [];
};

// --------------------------- PAGE ---------------------------
export default function Page() {
  const [user, setUser] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState([]);

  const prevMetricsRef = useRef([]);

  // Fetch both doctor and patient data
  const { adminMetrics, adminMetricsLoading } = useDoctor();
  const { patientMetrics, patientMetricsLoading } = usePatient();

  // Load user from localStorage
  useEffect(() => {
    setIsMounted(true);

    try {
      const saved = localStorage.getItem("user");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      }
    } catch (error) {
      console.error("Error loading user", error);
    }
  }, []);

  // Update metrics when data loads
  useEffect(() => {
    if (!isMounted || !user?.role) return;

    let updatedMetrics = [];

    if (user.role === "DOCTOR") {
      updatedMetrics = getMetricsByRole("DOCTOR", adminMetrics, {});
    } else if (user.role === "PATIENT") {
      updatedMetrics = getMetricsByRole("PATIENT", {}, patientMetrics);
    }

    // Only update if metrics actually changed
    if (JSON.stringify(updatedMetrics) !== JSON.stringify(prevMetricsRef.current)) {
      prevMetricsRef.current = updatedMetrics;
      setMetrics(updatedMetrics);
    }
  }, [isMounted, user, adminMetrics, patientMetrics]);

  // FIXED: Determine loading based on user role
  const isLoading = !isMounted || !user || 
    (user.role === "DOCTOR" && adminMetricsLoading) ||
    (user.role === "PATIENT" && patientMetricsLoading);

  return (
    <PageContainer scrollable>
      <div className="space-y-2 mb-4">

        {/* Greetings */}
        {user?.role === "PATIENT" && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome back, {user.full_name || user.name || "Patient"}!
            </h2>
            <p className="text-muted-foreground">Here's an overview of your activities</p>
          </div>
        )}

        {user?.role === "DOCTOR" && (
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {user.full_name || user.name || "Doctor"}
              <Badge className="bg-[#1D6502]/10 text-[#1D6502]">{user.role}</Badge>
            </h2>
            <p className="text-muted-foreground">Manage appointments, patients, and delivery records.</p>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsContent value="overview" className="space-y-4">

            {/* METRICS */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {isLoading
                ? [...Array(user?.role === "PATIENT" ? 2 : 3)].map((_, i) => <MetricSkeleton key={i} />)
                : metrics.map((metric, index) => (
                    <Card key={index} className="bg-[#F8FAFC] shadow-accent border-none p-4">
                      <Image src={metric.icon} alt="img" width={70} height={70} />
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl font-medium">{metric.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-semibold">{metric.count}</div>
                      </CardContent>
                    </Card>
                  ))}
            </div>

            {/* QUICK ACTIONS FOR DOCTOR */}
            {user?.role === "DOCTOR" && (
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 gap-4">
                  <h1 className="my-3 font-semibold">Quick Action</h1>
                  <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">

                    <Link href="/Dashboard/patients">
                      <div className="bg-[#F8FAFC] h-[100px] w-full rounded-md flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Plus className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">Add New Patient</h1>
                      </div>
                    </Link>

                    <Link href="/Dashboard/appointments">
                      <div className="bg-[#F8FAFC] h-[100px] w-full rounded-md flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Calendar className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">Schedule Appointment</h1>
                      </div>
                    </Link>

                    <Link href="/Dashboard/deliveries">
                      <div className="bg-[#F8FAFC] h-[100px] w-full rounded-md flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors">
                        <Server className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">Record Deliveries</h1>
                      </div>
                    </Link>

                  </div>
                </div>
              </div>
            )}

            {/* PATIENT QUICK INFO */}
            {user?.role === "PATIENT" && patientMetrics && (
              <div className="grid gap-4 md:grid-cols-2">
                {patientMetrics.last_visit_date && (
                  <Card className="bg-[#F8FAFC] border-none">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600">Last Visit</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">
                        {new Date(patientMetrics.last_visit_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {patientMetrics.next_appointment_date && (
                  <Card className="bg-[#F8FAFC] border-none">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600">Next Appointment</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold">
                        {new Date(patientMetrics.next_appointment_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}