"use client";
import ResetPassword from "@/views/ResetPassword";
// ResetPassword needs to be accessible? Usually yes, via email link.
// It handles its own session check? Yes.
// But if user is already logged in, maybe redirect?
// The component handles session checking.
// I'll wrap it in PublicRoute? No, reset password might happen while logged in? Unlikely.
// Usually reset password link opens in new tab.
// I'll leave it without PublicRoute for now, or check logic.
// ResetPassword.tsx logic: "Check if we have a valid recovery session".
// I'll just render it directly.

export default function Page() {
    return <ResetPassword />;
}
