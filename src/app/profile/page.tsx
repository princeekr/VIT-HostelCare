"use client";
import StudentProfile from "@/views/StudentProfile";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <StudentProfile />
        </ProtectedRoute>
    );
}
