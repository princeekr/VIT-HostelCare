"use client";
import AdminWorkers from "@/views/AdminWorkers";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <AdminWorkers />
        </ProtectedRoute>
    );
}
