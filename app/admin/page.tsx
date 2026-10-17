import { Metadata } from "next";
import { verifyAdminSession } from "@/lib/adminAuth";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin Reservations Desk",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  const isAuthenticated = verifyAdminSession();

  return (
    <div className="pt-24 lg:pt-32 pb-24 bg-base min-h-screen text-on-dark">
      <AdminDashboard initialAuthenticated={isAuthenticated} />
    </div>
  );
}
