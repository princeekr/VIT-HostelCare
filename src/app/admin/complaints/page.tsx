"use client";
import AdminComplaints from "@/views/AdminComplaints";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminComplaints />
        </ProtectedRoute>
    );
}
