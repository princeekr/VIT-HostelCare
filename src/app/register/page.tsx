"use client";
import Register from "@/views/Register";
import { PublicRoute } from "@/components/PublicRoute";

export default function Page() {
    return (
        <PublicRoute>
            <Register />
        </PublicRoute>
    );
}
