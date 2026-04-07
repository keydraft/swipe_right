import DashboardLayout from "@/components/layout/DashboardLayout";

export const metadata = {
    title: "Dashboard - Swipe Right",
};

export default function Layout({ children }) {
    return <DashboardLayout>{children}</DashboardLayout>;
}
