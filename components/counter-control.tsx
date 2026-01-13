"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  PhoneCall,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  PauseCircle,
  RotateCcw,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Queue {
  id: string;
  queue_number: number;
  service_type: string;
  status: string;
  created_at: string;
  call_count?: number;
}

const SERVICE_NAMES: Record<string, string> = {
  TKA: "LAPOR TENAGA KERJA ASING",
  AK1: "AK1 KARTU PENCARI KERJA",
  JKP: "JKP (JAMINAN KEHILANGAN PEKERJAAN)",
  MEDIASI: "LAINNYA (INFORMASI & PENGADUAN)",
};

const COUNTER_DEFAULTS: Record<number, string> = {
  1: "TKA",
  2: "AK1",
  3: "JKP",
  4: "MEDIASI",
};

export default function CounterControl({
  counterNumber,
}: {
  counterNumber: number;
}) {
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [selectedService, setSelectedService] = useState<string>(
    COUNTER_DEFAULTS[counterNumber] || "TKA"
  );

  const [waitingQueues, setWaitingQueues] = useState<Queue[]>([]);
  const [skippedQueues, setSkippedQueues] = useState<Queue[]>([]); // KHUSUS SKIPPED
  const [currentQueue, setCurrentQueue] = useState<Queue | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [localCallCount, setLocalCallCount] = useState(0);
  const [stats, setStats] = useState({
    waiting: 0,
    completed: 0,
    skipped: 0,
    cancelled: 0,
  });

  const supabase = createClient();

  useEffect(() => {
    if (isAutoMode && COUNTER_DEFAULTS[counterNumber]) {
      setSelectedService(COUNTER_DEFAULTS[counterNumber]);
    }
  }, [isAutoMode, counterNumber]);

  // --- FETCHERS ---
  const loadWaitingQueues = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("service_type", selectedService)
      .eq("status", "waiting")
      .order("queue_number", { ascending: true })
      .limit(10);
    if (data) setWaitingQueues(data);
  };

  // Fetch yang di-HOLD / SKIPPED
  // Balikin lagi nyari yang statusnya SKIPPED
  const loadSkippedQueues = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("service_type", selectedService)
      .eq("status", "skipped") // <--- PAKE SKIPPED (Udah halal sekarang)
      .order("queue_number", { ascending: true });
    if (data) setSkippedQueues(data);
  };

  const loadCurrentQueue = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("counter_number", counterNumber)
      .eq("status", "called")
      .order("called_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setCurrentQueue(data);
      setLocalCallCount(data.call_count || 1);
    } else {
      setCurrentQueue(null);
      setLocalCallCount(0);
    }
  };

  // ... loadWaitingQueues, loadSkippedQueues, loadCurrentQueue ...

  const loadStats = async () => {
    // 1. Bikin format tanggal HARI INI (sesuai jam laptop/WIB)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    // Hasil: "2026-01-13" (Contoh) - Awal hari ini jam 00:00
    const todayStr = `${year}-${month}-${day}`; // 2. Jalanin 4 query terpisah, masing-masing ditempel filter hari ini (.gte)

    const [wait, comp, skip, canc] = await Promise.all([
      // WAITING (Hari Ini)
      supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("service_type", selectedService)
        .eq("status", "waiting")
        .gte("created_at", todayStr), // <--- Filter Tanggal Masuk Sini // COMPLETED (Hari Ini)

      supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("service_type", selectedService)
        .eq("status", "completed")
        .gte("created_at", todayStr), // <--- Sini juga // SKIPPED/HOLD (Hari Ini)

      supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("service_type", selectedService)
        .eq("status", "skipped")
        .gte("created_at", todayStr), // <--- Sini juga // CANCELLED (Hari Ini)

      supabase
        .from("queues")
        .select("*", { count: "exact", head: true })
        .eq("service_type", selectedService)
        .eq("status", "cancelled")
        .gte("created_at", todayStr), // <--- Dan sini
    ]);

    setStats({
      waiting: wait.count || 0,
      completed: comp.count || 0,
      skipped: skip.count || 0,
      cancelled: canc.count || 0,
    });
  };

  // Di useEffect
  useEffect(() => {
    loadWaitingQueues();
    loadSkippedQueues();
    loadCurrentQueue();
    loadStats(); // <--- Panggil Disini

    const channel = supabase
      .channel("counter-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        () => {
          loadWaitingQueues();
          loadSkippedQueues();
          loadCurrentQueue();
          loadStats(); // <--- Dan Disini (Realtime)
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [selectedService, counterNumber]);

  // --- ACTIONS ---
  const handleCallNext = async () => {
    if (waitingQueues.length === 0) return;
    setIsLoading(true);

    // Ambil antrian yang mau dipanggil
    const nextQueue = waitingQueues[0];

    // --- FIX DISINI: ---
    // Langsung buang dia dari list lokal SEKARANG JUGA.
    // Jangan nunggu reload dari database (kelamaan/race condition).
    setWaitingQueues((prev) => prev.filter((q) => q.id !== nextQueue.id));

    try {
      // Baru update ke database
      const { error } = await supabase
        .from("queues")
        .update({
          status: "called",
          counter_number: counterNumber,
          called_at: new Date().toISOString(),
          call_count: 1,
        })
        .eq("id", nextQueue.id);

      if (error) throw error;

      await loadStats();

      // Refresh data biar sinkron sama DB
      await loadCurrentQueue();
      // loadWaitingQueues sebenernya opsional karena udah di-filter di atas,
      // tapi tetep dipanggil buat mastiin data akurat
      await loadWaitingQueues();
    } catch (e) {
      console.error(e);
      // Kalau error, balikin lagi listnya (rollback)
      await loadWaitingQueues();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecallCurrent = async () => {
    if (!currentQueue) return;
    const newCount = localCallCount + 1;
    setLocalCallCount(newCount);
    await supabase
      .from("queues")
      .update({
        called_at: new Date().toISOString(),
        call_count: newCount,
      })
      .eq("id", currentQueue.id);
  }; // --- LOGIC HOLD / SKIP (VERSI FULL) ---

  // --- LOGIC HOLD / SKIP ---
  // --- LOGIC HOLD / SKIP ---
  const handleHold = async () => {
    if (!currentQueue) return;

    // INI YANG TADI ILANG: Definisi variable confirmMsg
    const confirmMsg =
      localCallCount < 3
        ? `Baru dipanggil ${localCallCount}x. Yakin mau LEWATI antrian ini?`
        : "Lewati antrian ini?";

    if (!confirm(confirmMsg)) return;

    setIsLoading(true);
    try {
      // Update status jadi SKIPPED
      const { error } = await supabase
        .from("queues")
        .update({
          status: "skipped",
          counter_number: null,
        })
        .eq("id", currentQueue.id);
      if (error) throw error;
      await loadStats();

      setCurrentQueue(null);
      await loadWaitingQueues();
      await loadSkippedQueues();
    } catch (e: any) {
      alert("Gagal Hold: " + (e.message || "Unknown error"));
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC RECALL DARI HOLD ---
  const handleRecallFromSkipped = async (queueId: string) => {
    if (currentQueue) {
      alert("Selesaikan antrian saat ini dulu.");
      return;
    }
    setIsLoading(true);
    try {
      await supabase
        .from("queues")
        .update({
          status: "called",
          counter_number: counterNumber,
          called_at: new Date().toISOString(),
          call_count: 1,
        })
        .eq("id", queueId);
      await loadStats();
      await loadSkippedQueues();
      await loadCurrentQueue();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentQueue) return;
    await supabase
      .from("queues")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", currentQueue.id);
    setCurrentQueue(null);
    await loadStats();
    await loadWaitingQueues();
  };

  const handleCancel = async () => {
    if (!currentQueue || !confirm("Batalkan antrian secara permanen?")) return;
    await supabase
      .from("queues")
      .update({ status: "cancelled" })
      .eq("id", currentQueue.id);
    setCurrentQueue(null);
    await loadStats();
    await loadWaitingQueues();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header & Select Service (sama kaya sebelumnya) */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-blue-600">
              LOKET {counterNumber}
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-blue-700">
                  {stats.waiting}
                </span>
                <span className="text-xs font-medium text-blue-600 uppercase mt-1">
                  Menunggu
                </span>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-green-700">
                  {stats.completed}
                </span>
                <span className="text-xs font-medium text-green-600 uppercase mt-1">
                  Selesai
                </span>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-orange-700">
                  {stats.skipped}
                </span>
                <span className="text-xs font-medium text-orange-600 uppercase mt-1">
                  Hold / Lewat
                </span>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-bold text-red-700">
                  {stats.cancelled}
                </span>
                <span className="text-xs font-medium text-red-600 uppercase mt-1">
                  Batal
                </span>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium">
                Jenis Layanan
              </CardTitle>
              <Button
                variant={isAutoMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsAutoMode(!isAutoMode)}
              >
                {isAutoMode ? "Auto Lock" : "Manual"}
              </Button>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
                disabled={isAutoMode}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TKA">LAPOR TENAGA KERJA ASING</SelectItem>
                  <SelectItem value="AK1">AK1 KARTU PENCARI KERJA</SelectItem>
                  <SelectItem value="JKP">
                    JKP (JAMINAN KEHILANGAN PEKERJAAN)
                  </SelectItem>
                  <SelectItem value="MEDIASI">
                    LAINNYA (INFORMASI & PENGADUAN)
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* ACTIVE QUEUE CARD */}
          <Card className="border-2 border-blue-100 shadow-md">
            <CardHeader>
              <CardTitle>Sedang Melayani</CardTitle>
            </CardHeader>
            <CardContent>
              {currentQueue ? (
                <div className="space-y-6">
                  <div className="text-center py-8 bg-blue-50 rounded-lg relative">
                    <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-bold border border-yellow-300">
                      Dipanggil: {localCallCount}x
                    </div>
                    <p className="text-6xl font-bold text-blue-600">
                      {currentQueue.service_type}
                      {String(currentQueue.queue_number).padStart(3, "0")}
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={handleRecallCurrent}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Volume2 className="w-4 h-4 mr-2" /> Panggil Ulang
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
                    <Button
                      onClick={handleComplete}
                      className="flex-1 bg-green-600 hover:bg-green-700 h-12"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" /> Selesai
                    </Button>
                    {/* HOLD BUTTON */}
                    <Button
                      onClick={handleHold}
                      variant="secondary"
                      className="flex-1 bg-orange-100 text-orange-700 hover:bg-orange-200 h-12 border border-orange-200"
                    >
                      <PauseCircle className="w-5 h-5 mr-2" /> Lewati (Hold)
                    </Button>
                    {/* CANCEL BUTTON */}
                    <Button
                      onClick={handleCancel}
                      variant="destructive"
                      className="flex-1 h-12"
                    >
                      <XCircle className="w-5 h-5 mr-2" /> Batal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p>Tidak ada antrian aktif</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleCallNext}
            disabled={isLoading || waitingQueues.length === 0 || !!currentQueue}
            className="w-full shadow-lg"
            size="lg"
          >
            <PhoneCall className="w-5 h-5 mr-2" /> Panggil Antrian Selanjutnya
          </Button>

          {/* --- LIST ANTRIAN YANG DI-HOLD / SKIPPED --- */}
          {skippedQueues.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-orange-700 flex items-center gap-2 text-base">
                  <PauseCircle className="w-5 h-5" />
                  Antrian Terlewat / Hold ({skippedQueues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {skippedQueues.map((queue) => (
                    <div
                      key={queue.id}
                      className="flex items-center justify-between p-3 bg-white rounded border border-orange-100 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg text-gray-700">
                          {queue.service_type}
                          {String(queue.queue_number).padStart(3, "0")}
                        </span>
                        <span className="text-xs text-gray-500">
                          Dibuat:{" "}
                          {new Date(queue.created_at).toLocaleTimeString(
                            "id-ID",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                        onClick={() => handleRecallFromSkipped(queue.id)}
                        disabled={!!currentQueue}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" /> Panggil
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* LIST WAITING */}
          <Card>
            <CardHeader>
              <CardTitle>Antrian Menunggu ({waitingQueues.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {waitingQueues.length > 0 ? (
                <div className="space-y-2">
                  {waitingQueues.map((queue, index) => (
                    <div
                      key={queue.id}
                      className={`flex justify-between p-4 rounded-lg ${
                        index === 0
                          ? "bg-blue-50 border-2 border-blue-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <p className="font-bold text-lg text-gray-800">
                        {queue.service_type}
                        {String(queue.queue_number).padStart(3, "0")}
                      </p>
                      {index === 0 && (
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
                          Next
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Aman, tidak ada antrian
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
