"use client";
import StudentDashboard from "@/views/StudentDashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
        </ProtectedRoute>
    );
}
