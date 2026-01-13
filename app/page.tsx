"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, BookOpen, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Anton } from "next/font/google";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
});

export default function HomePage() {
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const router = useRouter();

  const [activeCard, setActiveCard] = useState<"queue" | "guest" | null>(null);

  const getInitialX = () => {
    if (selectedMenu === "layanan") return -300; // Dari luar kiri
    if (selectedMenu === "tamu") return 300; // Dari luar kanan
    return 0; // Posisi default (tampilan awal)
  };

  const handleGenerateTicket = (path: string) => {
    router.push(path);
  };

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 via-blue to-blue-50 overflow-hidden relative flex flex-col justify-between">
      {/* ================= HEADER ================= */}
      <div className="max-w-[86rem] mx-auto px-4 mt-8 w-full relative z-20">
        <header className="bg-[#EBF7FF] rounded-3xl px-8 py-6 grid grid-cols-3 items-center shadow-lg border-2 border-white/50 relative">
          <div
            className="justify-self-start cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => setActiveCard(null)}
          >
            <img
              src="/disnaker logo png.svg"
              alt="Disnaker Logo"
              className="h-16 w-auto"
            />
          </div>
          <div className="justify-self-center flex flex-col items-center text-center">
            <h1
              className={`${anton.className} text-5xl leading-none text-blue-600 tracking-wide`}
            >
              DIS<span className="text-green-600">NAKER</span>
            </h1>
            <p
              // Ganti text-2xl jadi text-[1.35rem] biar muat masuk ke dalem lebar DISNAKER
              // Tracking tetep di 0.17em sesuai request lu
              className={`${anton.className} text-[1.50rem] text-black tracking-[0.17em] leading-none mt-0 ml-[4px]`}
            >
              KOTA BANDUNG
            </p>
          </div>
          <div className="justify-self-end text-right">
            <p className="text-xs text-gray-500 font-medium mb-1">
              {currentDate}
            </p>
            <p className="text-4xl text-gray-600 font-normal tracking-tight">
              {currentTime}
            </p>
          </div>
        </header>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <main className="w-full flex-grow flex flex-col items-center justify-center relative z-10">
        {/* BACKGROUND TENGAH (GEAR) */}
        <AnimatePresence>
          {activeCard === null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none"
            >
              <img
                src="/bg-antara.png"
                alt="Background Gear"
                className="w-[350px] h-auto object-contain"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- DULUNYA ILUSTRASI DISINI, SEKARANG PINDAH KE BAWAH --- */}

        {/* JUDUL */}
        <AnimatePresence>
          {activeCard === null && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center mb-6 z-20 relative"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Selamat Datang
              </h2>
              <p className="text-base text-gray-600">
                Silakan pilih layanan yang Anda butuhkan
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CARD WRAPPER */}
        <motion.div
          className="flex flex-row items-center justify-center z-20 relative"
          animate={{
            x: activeCard === "queue" ? 150 : activeCard === "guest" ? -150 : 0,
            gap: activeCard === null ? "48px" : "96px",
          }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          {/* CARD 1 */}
          <motion.div
            layout
            onClick={() => setActiveCard("queue")}
            className={`
            relative cursor-pointer rounded-[1.5rem] bg-white transition-all duration-500
            flex flex-col items-center justify-center
            ${
              activeCard === "queue"
                ? "shadow-2xl z-20 border-t-4 border-blue-500 opacity-100"
                : activeCard === null
                ? "shadow-md z-10 border border-gray-100 opacity-100 hover:shadow-lg hover:border-blue-200"
                : "shadow-none z-0 border border-gray-100 opacity-40 hover:opacity-100 bg-white"
            }
          `}
            animate={{
              width:
                activeCard === "queue" ? 360 : activeCard === null ? 290 : 240,
              height:
                activeCard === "queue" ? 450 : activeCard === null ? 354 : 300,
              scale: 1,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <CardContent className="p-0 w-full h-full flex flex-col items-center justify-center text-center relative px-4">
              <motion.div layout className="mb-4">
                <img
                  src="/layanan-antrian.svg"
                  alt="Layanan Antrian"
                  className={`transition-all duration-500 ${
                    activeCard === "queue"
                      ? "w-32 h-32"
                      : activeCard === null
                      ? "w-28 h-28"
                      : "w-20 h-20 grayscale"
                  }`}
                />
              </motion.div>
              <motion.h3
                layout
                className="text-xl font-bold text-gray-900 mb-2"
              >
                LAYANAN
              </motion.h3>
              <AnimatePresence>
                {activeCard === null && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-500 text-xs px-2"
                  >
                    Ambil nomor antrian untuk layanan Disnaker
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {activeCard === "queue" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center w-full mt-2"
                  >
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed px-4">
                      Untuk pertanyaan terkait layanan, pengaduan, dan informasi
                      ketenagakerjaan.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateTicket("/queue");
                      }}
                      className="bg-[#EBF7FF] text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-2 rounded-xl font-bold text-base transition-all w-full shadow-sm"
                    >
                      Pilih Layanan
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </motion.div>

          {/* CARD 2 */}
          <motion.div
            layout
            onClick={() => setActiveCard("guest")}
            className={`
            relative cursor-pointer rounded-[1.5rem] bg-white transition-all duration-500
            flex flex-col items-center justify-center
            ${
              activeCard === "guest"
                ? "shadow-2xl z-20 border-t-4 border-green-500 opacity-100"
                : activeCard === null
                ? "shadow-md z-10 border border-gray-100 opacity-100 hover:shadow-lg hover:border-green-200"
                : "shadow-none z-0 border border-gray-100 opacity-40 hover:opacity-100 bg-white"
            }
          `}
            animate={{
              width:
                activeCard === "guest" ? 360 : activeCard === null ? 290 : 240,
              height:
                activeCard === "guest" ? 450 : activeCard === null ? 354 : 300,
              scale: 1,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <CardContent className="p-0 w-full h-full flex flex-col items-center justify-center text-center relative px-4">
              <motion.div layout className="mb-4">
                <img
                  src="/buku-queue.svg"
                  alt="Buku Tamu"
                  className={`transition-all duration-500 ${
                    activeCard === "guest"
                      ? "w-32 h-32"
                      : activeCard === null
                      ? "w-28 h-28"
                      : "w-20 h-20 grayscale"
                  }`}
                />
              </motion.div>
              <motion.h3
                layout
                className="text-xl font-bold text-gray-900 mb-2"
              >
                BUKU TAMU
              </motion.h3>
              <AnimatePresence>
                {activeCard === null && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-gray-500 text-xs px-2"
                  >
                    Daftarkan kunjungan Anda di sini
                  </motion.p>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {activeCard === "guest" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center w-full mt-2"
                  >
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed px-4">
                      Untuk tamu dinas, kunjungan kerja, atau keperluan
                      administratif lainnya.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateTicket("/guest-book");
                      }}
                      className="bg-green-50 text-green-700 hover:bg-green-600 hover:text-white px-8 py-2 rounded-xl font-bold text-base transition-all w-full shadow-sm"
                    >
                      Isi Buku Tamu
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </motion.div>
        </motion.div>

        {/* TOMBOL RESET */}
        {/* {activeCard !== null && (
          <div className="absolute bottom-20 left-0 right-0 text-center z-30">
            <button
              onClick={() => setActiveCard(null)}
              className="bg-white px-4 py-2 rounded-full text-gray-400 text-xs hover:text-gray-800 shadow-sm border"
            >
              Kembali ke Menu Awal
            </button>
          </div>
        )} */}
      </main>

      {/* ================= POSISI BARU ILUSTRASI (DYNAMIC) ================= */}
      <AnimatePresence mode="wait">
        <motion.div
          // PENTING: Key diganti sesuai logic ID yang bener
          key={activeCard || "home"}
          // LOGIC INITIAL: Sesuaikan dengan "queue" dan "guest"
          initial={{
            opacity: 0,
            x:
              activeCard === "queue" // GANTI "layanan" JADI "queue"
                ? -300
                : activeCard === "guest" // GANTI "buku_tamu" JADI "guest"
                ? 300
                : 50,
          }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          // CSS CLASS:
          // 1. Tambahin 'w-full' biar container lebarnya full layar
          // 2. Cek 'queue' buat nentuin left/right
          className={`absolute -bottom-1 z-0 pointer-events-none hidden lg:block ${
            activeCard === "queue" ? "left-0" : "right-0"
          }`}
        >
          <img
            src="/universal-queue-png.png"
            alt="Illustration"
            // LOGIC FLIP: Cek "queue" juga
            className={`h-[320px] w-auto object-contain drop-shadow-xl rendering-pixelated ${
              activeCard === "queue" ? "scale-x-[-1]" : ""
            }`}
          />
        </motion.div>
      </AnimatePresence>

      {/* ================= FOOTER ================= */}
      <footer className="w-full pb-4 pt-2 text-center z-50 bg-transparent relative pointer-events-none">
        {/* pointer-events-auto buat link biar tetep bisa diklik */}
        <div className="flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity pointer-events-auto">
          <div className="mb-2">
            <div className="bg-gradient-to-tr from-blue-500 to-green-500 w-6 h-6 rounded-md shadow-sm"></div>
          </div>
          <p className="text-xs font-bold text-gray-500 tracking-wide">
            Developed by Fadhil Firdaus Adha
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            D3 Teknik Informatika - Universitas Sangga Buana YPKP
          </p>
          <Link href="/admin" className="mt-1">
            <span className="text-[9px] text-gray-300 hover:text-blue-400 cursor-pointer">
              v1.0.0 (Admin Access)
            </span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
