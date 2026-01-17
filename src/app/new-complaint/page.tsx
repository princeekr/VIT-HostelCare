"use client";
import NewComplaint from "@/views/NewComplaint";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={['student']}>
            <NewComplaint />
        </ProtectedRoute>
    );
}
