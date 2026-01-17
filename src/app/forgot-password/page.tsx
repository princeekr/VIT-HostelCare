"use client";
import ForgotPassword from "@/views/ForgotPassword";
import { PublicRoute } from "@/components/PublicRoute";

export default function Page() {
    return (
        <PublicRoute>
            <ForgotPassword />
        </PublicRoute>
    );
}
