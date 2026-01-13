"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Monitor, Clock, LogOut } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const COUNTERS = [
  { id: 1, name: "Loket 1", color: "bg-blue-500" },
  { id: 2, name: "Loket 2", color: "bg-green-500" },
  { id: 3, name: "Loket 3", color: "bg-orange-500" },
  { id: 4, name: "Loket 4", color: "bg-purple-500" },
];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/admin/login");
        return;
      }

      setUser({
        email: session.user.email,
        fullName: session.user.user_metadata?.full_name || "Admin",
        role: "Administrator",
      });
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();
    localStorage.removeItem("adminSession");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <img
                src="/images/disnaker-ijo.png"
                alt="Disnaker Logo"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-blue-600">PANEL ADMIN</h1>
                <p className="text-sm text-gray-600">Manajemen Antrian</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.fullName}
                </p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pilih Loket</h2>
          <p className="text-lg text-gray-600">
            Pilih loket untuk mengelola antrian
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {COUNTERS.map((counter) => (
            <Link key={counter.id} href={`/admin/counter/${counter.id}`}>
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-500">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div
                      className={`w-20 h-20 ${counter.color} rounded-full flex items-center justify-center mx-auto mb-4`}
                    >
                      <Monitor className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {counter.name}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Additional Admin Options */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Menu Tambahan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/display">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Tampilan Display Antrian
                </Button>
              </Link>
              <Link href="/admin/guest-book">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Lihat Buku Tamu
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
