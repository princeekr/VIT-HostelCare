"use client";
import MyComplaints from "@/views/MyComplaints";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <MyComplaints />
        </ProtectedRoute>
    );
}
