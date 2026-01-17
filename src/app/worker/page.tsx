"use client";
import WorkerDashboard from "@/views/WorkerDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['worker']}>
            <WorkerDashboard />
        </ProtectedRoute>
    );
}
