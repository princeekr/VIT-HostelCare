import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata = {
    title: "VIT HostelCare",
    description: "VIT Hostel Management System",
    icons: {
        icon: "/vit-logo.jpg",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
