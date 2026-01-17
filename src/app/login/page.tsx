"use client";
import Login from "@/views/Login";
import { PublicRoute } from "@/components/PublicRoute";

export default function Page() {
    return (
        <PublicRoute>
            <Login />
        </PublicRoute>
    );
}
