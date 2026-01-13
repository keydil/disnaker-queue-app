"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Anton } from "next/font/google"; // Pastikan import font ini

// Setup Font Anton biar angka antriannya gagah
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
});

// Tipe Data
interface Queue {
  id: string;
  queue_number: number;
  service_type: string;
  counter_number: number;
}

// Mapping Kode Layanan ke Nama Panjang & Warna Panah (Sesuai Gambar)
const SERVICE_INFO: Record<string, { title: string; desc: string }> = {
  AK1: { title: "AK1", desc: "Kartu pencari kerja" },
  MEDIASI: { title: "MDS", desc: "Mediasi hubungan Industri" },
  JKP: { title: "JKP", desc: "Jaminan kehilangan pekerjaan" },
  TKA: { title: "TKA", desc: "Lapor tenaga kerja asing" },
};

// Warna Panah per Loket (Sesuai urutan gambar: Biru, Hijau, Kuning, Merah)
const COUNTER_COLORS = [
  "text-blue-600",    // Loket 1 (Biru)
  "text-green-600",   // Loket 2 (Hijau)
  "text-yellow-400",  // Loket 3 (Kuning)
  "text-red-500",     // Loket 4 (Merah/Oren)
];

export default function QueueDisplay() {
  const [calledQueues, setCalledQueues] = useState<Queue[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const loadCalledQueues = async () => {
      // Di dalam useEffect -> loadCalledQueues
      const { data } = await supabase
        .from("queues")
        .select("*")
        .eq("status", "called")
        .order("called_at", { ascending: false })
        .limit(20); // <--- GANTI JADI 20 ATAU 50

      if (data) setCalledQueues(data);
    };

    loadCalledQueues();

    const channel = supabase
      .channel("display-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        () => {
          loadCalledQueues();
        }
      )
      .subscribe();

    // Update Jam & Tanggal
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString("en-GB", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* ================= HEADER (Background Putih) ================= */}
      <header className="bg-white border-b-4 border-blue-50 py-4 shadow-sm">
        <div className="container mx-auto px-8 flex items-center justify-between">
          {/* Logo Kiri */}
          <div className="flex items-center gap-4">
            <img
              src="/disnaker logo png.svg"
              alt="Logo"
              className="h-16 w-auto"
            />
            <div className="flex flex-col">
              <h1
                className={`${anton.className} text-4xl text-blue-600 tracking-wide leading-none`}
              >
                DIS<span className="text-green-600">NAKER</span>
              </h1>
              <p className="text-sm font-bold tracking-widest text-black">
                KOTA BANDUNG
              </p>
            </div>
          </div>

          {/* Jam Kanan */}
          <div className="text-right">
            <p className="text-sm text-gray-500 font-medium">{currentDate}</p>
            <p className="text-5xl text-gray-600 font-normal tracking-tight">
              {currentTime}
            </p>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT ================= */}
      <main className="flex-grow container mx-auto px-8 py-8">
        {/* Judul Section */}
        <h2 className="text-center text-3xl font-bold text-[#1e3a8a] mb-10">
          Antrian yang dipanggil
        </h2>

        {/* Grid Kartu Loket */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((counterNum, index) => {
            // Cari antrian untuk loket ini (yang paling baru)
            // YANG BARU (Lebih aman, paksa jadi Number dulu)
            const queue = calledQueues.find(
              (q) => Number(q.counter_number) === counterNum
            );
            const info = queue ? SERVICE_INFO[queue.service_type] : null;
            const arrowColor = COUNTER_COLORS[index % 4]; // Puter warna sesuai index

            return (
              <div key={counterNum} className="flex flex-col">
                {/* 1. HEADER KARTU (Bentuk Panah) */}
                {/* 1. HEADER KARTU (Bentuk Panah Custom) */}
                <div className="flex h-12 w-full mb-1 relative drop-shadow-md items-center">
                  {/* WRAPPER UTAMA (Pengganti Div Biru Lama) */}
                  <div className="relative flex-grow h-full flex items-center">
                    {/* A. SVG BACKGROUND (Bentuk Biru Custom) */}
                    {/* Kita set w-full h-full biar dia ngisi kotak, dan preserveAspectRatio="none" biar dia melar ngikutin lebar kartu */}
                    <svg
                      viewBox="0 0 277 46"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute left-0 top-0 h-full w-[88%] max-w-none text-[#044EEB] z-0"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M276.178 21.2256L248.282 45.2295H0V0H251.511L276.178 21.2256Z"
                        fill="currentColor"
                      />
                    </svg>

                    {/* B. TEKS LOKET (Di atas SVG) */}
                    {/* z-10 biar muncul di atas gambar, pl-6 biar agak nengah dikit */}
                    <span className="relative z-10 text-white font-bold text-lg pl-6 w-full">
                      LOKET {counterNum}
                    </span>
                  </div>

                  {/* BAGIAN PANAH KANAN (YANG WARNA-WARNI) */}
                  {/* Ini kodingan panah buntut yang sebelumnya (jangan dihapus) */}
                  <svg
                    width="56"
                    height="48"
                    viewBox="0 0 56 46"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`absolute -right-[1px] top-0 h-12 w-auto z-0 animate-kedip ${COUNTER_COLORS[counterNum - 1]}`}
                  >
                    <path
                      d="M55.0547 21.2256L27.1592 45.2295H0L27.8945 21.2266L3.22559 0H30.3867L55.0547 21.2256Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

                {/* 2. BODY KARTU (Biru Besar) */}
                <div className="bg-[#0d6efd] text-white rounded-xl rounded-tl-none p-6 text-center shadow-lg min-h-[200px] flex flex-col justify-center items-center mt-2 relative z-0">
                  {queue && info ? (
                    <>
                      {/* Nomor Antrian Besar */}
                      <p
                        className={`${anton.className} text-7xl mb-2 tracking-wide`}
                      >
                        {info.title}{" "}
                        {String(queue.queue_number).padStart(3, "0")}
                      </p>
                      {/* Deskripsi Kecil */}
                      <p className="text-white text-sm font-medium opacity-90">
                        {info.desc}
                      </p>
                    </>
                  ) : (
                    <p className="text-white/50 text-xl font-bold">
                      Menunggu...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ================= FOOTER (History Biru Gelap) ================= */}
      <div className="bg-[#0b5ed7] w-full py-8 mt-auto border-t-4 border-blue-400">
        <div className="container mx-auto px-8">
          <h3 className="text-white text-2xl font-medium text-center mb-6">
            Daftar antrian terpanggil
          </h3>

          {/* Grid History */}
          <div className="grid grid-cols-2 gap-4">
            {calledQueues.slice(0, 4).map((queue) => (
              <div
                key={queue.id}
                className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3 flex items-center justify-between text-white border border-white/10"
              >
                <div className="flex flex-col">
                  <span className={`${anton.className} text-3xl`}>
                    {queue.service_type}
                    {String(queue.queue_number).padStart(3, "0")}
                  </span>
                  <span className="text-[10px] uppercase opacity-80 tracking-wider">
                    {SERVICE_INFO[queue.service_type]?.desc || "Layanan"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase opacity-70 block">
                    Dipanggil di
                  </span>
                  <span className="font-bold text-xl">
                    LOKET {queue.counter_number}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Copyright strip bawah */}
        <div className="text-center text-white/50 text-xs mt-8">
          Terima kasih atas kunjungan Anda - Harap menunggu panggilan
        </div>
      </div>
    </div>
  );
}
