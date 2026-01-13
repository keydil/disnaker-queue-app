"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Anton } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

// --- KONFIGURASI FONT ---
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
});

// --- INTERFACE ---
interface Queue {
  id: string;
  queue_number: number;
  service_type: string;
  counter_number: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// --- CONFIG DATA ---
const SERVICE_INFO: Record<string, { title: string; desc: string }> = {
  AK1: { title: "AK1", desc: "Kartu pencari kerja" },
  MEDIASI: { title: "MDS", desc: "Mediasi hubungan Industri" },
  JKP: { title: "JKP", desc: "Jaminan kehilangan pekerjaan" },
  TKA: { title: "TKA", desc: "Lapor tenaga kerja asing" },
};

const LOKET_CONFIG = [
  { id: 1, type: "TKA", arrowColor: "text-blue-600" },
  { id: 2, type: "AK1", arrowColor: "text-green-600" },
  { id: 3, type: "JKP", arrowColor: "text-yellow-400" },
  { id: 4, type: "MEDIASI", arrowColor: "text-red-500" },
];

// --- WARNA NEON (Untuk Border Biasa) ---
const NEON_COLORS: Record<string, string> = {
  TKA: "border-blue-400",
  AK1: "border-green-400",
  JKP: "border-yellow-400",
  MEDIASI: "border-red-400",
};

// --- WARNA PORTAL (Cairan Energi yang Muter) ---
const MAGIC_HEX: Record<string, string> = {
  TKA: "#2563EB",   // Biru
  AK1: "#16A34A",   // Hijau
  JKP: "#EAB308",   // Kuning
  MEDIASI: "#EF4444" // Merah
};

export default function QueueDisplay() {
  const [allQueues, setAllQueues] = useState<Queue[]>([]);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "split">("grid");

  const supabase = createClient();

  useEffect(() => {
    const switchInterval = setInterval(() => {
      setViewMode((prev) => (prev === "grid" ? "split" : "grid"));
    }, 43000); 
    return () => clearInterval(switchInterval);
  }, []);

  const loadQueues = async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .in("status", ["waiting", "called", "processing", "completed", "done", "served"])
      .order("created_at", { ascending: true });

    if (data) setAllQueues(data);
  };

  const announceQueue = (queue: Queue) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const kodeLayanan = queue.service_type.split("").join(" ");
    const angkaAntrian = parseInt(String(queue.queue_number));
    const text = `Nomor Antrian,,, ${kodeLayanan},,, ${angkaAntrian},,, Silakan ke loket,,, ${
      queue.counter_number || 1
    }`;

    const utterance = new SpeechSynthesisUtterance(text);
    // @ts-ignore
    window.speechRequest = utterance;
    utterance.lang = "id-ID";
    utterance.rate = 0.8;

    utterance.onend = () => {
      // @ts-ignore
      delete window.speechRequest;
    };

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    loadQueues();

    const channel = supabase
      .channel("display-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        (payload) => {
          loadQueues();
          // @ts-ignore
          if (payload.new && payload.new.status === "called") {
            announceQueue(payload.new as Queue);
          }
        }
      )
      .subscribe();

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[url('/nyobabg2.png')] bg-cover bg-center bg-fixed flex flex-col font-sans overflow-hidden relative">
      <header className="w-full pt-8 pb-4 px-12 z-40 relative">
        <div className="w-full flex items-center justify-between h-20 relative">
          <div className="flex-shrink-0 z-10">
            <img src="/disnaker logo png.svg" alt="Logo" className="h-24 w-auto object-contain drop-shadow-md" />
          </div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center justify-center min-w-[400px]">
            <p className="text-[10px] tracking-[0.3em] text-gray-500 font-bold uppercase mb-[-2px]">PEMERINTAH KOTA BANDUNG</p>
            <h1 className={`${anton.className} text-7xl tracking-wide leading-none drop-shadow-sm mt-1`}>
              <span className="text-[#005596]">DIS</span><span className="text-[#00913E]">NAKER</span>
            </h1>
            <p className="text-xs font-bold text-gray-600 tracking-[0.4em] uppercase mt-0">KOTA BANDUNG</p>
          </div>
          <div className={`flex-shrink-0 flex flex-col items-end justify-center text-right z-10 ${anton.className}`}>
            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mb-[-6px]">{currentDate}</p>
            <p className="text-[5.5rem] text-black/65 font-extrabold leading-none tracking-tight">{currentTime}</p>
          </div>
        </div>
      </header>

      <main className={`flex-grow container mx-auto px-6 py-4 relative transition-all duration-500 ${viewMode === "split" ? "pb-24" : "pb-0"}`}>
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div key="grid-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-4 gap-6 h-full items-start">
              {LOKET_CONFIG.map((loket) => (
                <QueueColumn key={loket.id} loketConfig={loket} allQueues={allQueues} />
              ))}
            </motion.div>
          ) : (
            <SplitLayout key="split-view" allQueues={allQueues} />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence mode="wait">
        {viewMode === "split" ? (
          <RunningText key="running-text" content="SELAMAT DATANG DI DISNAKER KOTA BANDUNG • MELAYANI DENGAN SEPENUH HATI • BUDAYAKAN ANTRE •" />
        ) : (
          <motion.footer key="footer-credit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full pb-4 pt-2 text-center z-50 bg-transparent relative">
            <div className="flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
               <div className="mb-2"><div className="bg-gradient-to-tr from-blue-500 to-green-500 w-6 h-6 rounded-md shadow-sm"></div></div>
               <p className="text-xs font-bold text-gray-500 tracking-wide">Developed by Fadhil Firdaus Adha</p>
               <p className="text-[10px] text-gray-400 mt-0.5">D3 Teknik Informatika - Universitas Sangga Buana YPKP</p>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}

// === COMPONENT KOLOM (MODE GRID) ===
// === COMPONENT KOLOM (MODE GRID - DISINI PERBAIKANNYA) ===
function QueueColumn({ loketConfig, allQueues }: { loketConfig: any; allQueues: Queue[] }) {
  const rawQueues = allQueues.filter((q) => q.service_type === loketConfig.type);
  
  const waiting = rawQueues
    .filter((q) => q.status === "waiting")
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  
  const calledRaw = rawQueues.filter((q) => q.status === "called" || q.status === "processing");
  const latestCalled = calledRaw.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const completed = rawQueues
    .filter((q) => ["completed", "done", "served"].includes(q.status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let finalQueues: Queue[] = [];
  
  // LOGIC GRID VIEW:
  // Disini kita LONGGARKAN aturannya.
  // Walau cuma 1 waiting, TAMPILKAN SAJA (biar list kelihatan).
  // Aturan "hide if 1" cuma buat Split View (Main Card).
  
  if (latestCalled) {
    // 1. DIPANGGIL -> Tampil
    finalQueues = [latestCalled, ...waiting];
  } 
  else if (completed.length > 0) {
    // 2. SELESAI
    if (waiting.length > 0) {
       const lastCompleted = completed[0];
       const firstWaiting = waiting[0];
       const completedTime = new Date(lastCompleted.updated_at || lastCompleted.created_at).getTime();
       const waitingTime = new Date(firstWaiting.created_at).getTime();

       if (completedTime < waitingTime) {
          // Jeda Lama (Zombie) -> Hapus history, tampilkan waiting murni
          finalQueues = [...waiting]; 
       } else {
          // Nyambung -> Tahan history
          finalQueues = [lastCompleted, ...waiting];
       }
    } else {
       finalQueues = []; // Habis
    }
  } 
  else {
    // 3. WAITING ONLY
    // FIX DISINI: Selalu tampilkan waiting berapapun jumlahnya
    finalQueues = [...waiting];
  }

  const isTopCalled = finalQueues.length > 0 && (finalQueues[0].status === "called" || finalQueues[0].status === "processing");

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex h-12 w-full mb-4 relative drop-shadow-md items-center z-20">
        <div className="relative flex-grow h-full flex items-center">
            <svg viewBox="0 0 277 46" fill="none" className="absolute left-0 top-0 h-full w-[86%] max-w-none text-[#044EEB]" preserveAspectRatio="none">
                <path d="M276.178 21.2256L248.282 45.2295H0V0H251.511L276.178 21.2256Z" fill="currentColor" />
            </svg>
            <span className="relative z-10 text-white font-bold text-lg pl-6 w-full tracking-wider uppercase">LOKET {loketConfig.id}</span>
        </div>
        <motion.svg 
            width="56" height="48" viewBox="0 0 56 46" fill="none" 
            className={`absolute -right-[1px] top-0 h-12 w-auto z-10 ${loketConfig.arrowColor}`}
            animate={isTopCalled ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
            <path d="M55.0547 21.2256L27.1592 45.2295H0L27.8945 21.2266L3.22559 0H30.3867L55.0547 21.2256Z" fill="currentColor" />
        </motion.svg>
      </div>

      <div className="flex flex-col w-full relative space-y-4">
        <AnimatePresence mode="popLayout">
          {finalQueues.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-50 border-2 border-dashed border-gray-200 p-6 rounded-xl text-center text-gray-400 mt-2 pt-6">
              <span className="text-sm font-medium">Menunggu Antrian...</span>
            </motion.div>
          ) : (
            finalQueues.map((queue, index) => <QueueCard key={queue.id} queue={queue} index={index} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// === QUEUE CARD (GRID - MAGIC BORDER SESUAI KOTAK) ===
function QueueCard({ queue, index }: { queue: Queue; index: number }) {
  const info = SERVICE_INFO[queue.service_type];
  const isTopCard = index === 0;
  const isCalled = queue.status === "called" || queue.status === "processing";
  
  const baseNeon = NEON_COLORS[queue.service_type] || "border-blue-400";
  const magicHex = MAGIC_HEX[queue.service_type] || "#2563EB";

  return (
    <motion.div
      layout
      animate={{ scale: isCalled ? 1.05 : 1, opacity: 1, y: 0 }}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full relative group z-10"
    >
      {/* LOGIKA BINGKAI PORTAL:
        1. Container luar (relative) overflow hidden + Rounded.
        2. Layer "Spinner" (absolute) ukuran jumbo di belakang, muter terus.
        3. Layer "Konten" (absolute/inset) di depan, ukurannya lebih kecil dikit (inset).
        Hasil: Pinggirannya kelihatan kayak border yang jalan (karena spinner di belakangnya muter).
      */}
      
      <div className={`relative w-full h-[160px] rounded-xl overflow-hidden shadow-2xl transition-all duration-300
         ${isTopCard && !isCalled ? `border-2 ${baseNeon}` : ""} 
         ${!isTopCard ? "border border-white/10 opacity-90" : ""}
      `}>
        
        {/* --- PORTAL SPINNER (Hanya Muncul Pas Called) --- */}
        {isCalled && (
          <motion.div 
            className="absolute inset-[-150%]" // Ukuran Jumbo biar cover pas muter
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{
              background: `conic-gradient(from 0deg, transparent 0deg, transparent 50deg, ${magicHex} 100deg, transparent 180deg, transparent 250deg, ${magicHex} 300deg, transparent 360deg)`
            }}
          />
        )}
        
        {/* --- CONTENT CARD (Ditumpuk di atas Spinner) --- */}
        {/* Kasih margin/padding kecil (m-[4px]) biar spinner di belakang kelihatan jadi border */}
        <div className={`absolute ${isCalled ? "inset-[4px]" : "inset-0"} bg-blue-600 rounded-lg flex flex-col justify-center items-center p-4 z-10`}>
             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg pointer-events-none"></div>
             
             <p className={`${anton.className} text-6xl mb-2 tracking-wide leading-none z-10 drop-shadow-sm text-white`}>
               {info?.title} {String(queue.queue_number).padStart(3, "0")}
             </p>
             <p className="text-white font-bold text-xs tracking-[0.15em] uppercase z-10 opacity-90 border-t border-white/30 pt-2 w-3/4 text-center">
               {info?.desc || "Layanan"}
             </p>
        </div>

      </div>
    </motion.div>
  );
}

// === SPLIT LAYOUT (SPLIT - MAGIC BORDER SESUAI KOTAK) ===
function SplitLayout({ allQueues }: { allQueues: Queue[] }) {
  return (
    <div className="flex flex-col h-full w-full px-6 gap-6">
      <div className="grid grid-cols-12 gap-8 flex-grow min-h-0">
        
        <div className="col-span-3 flex flex-col justify-between gap-4 h-full">
          {LOKET_CONFIG.map((loket, index) => {
            const rawQueues = allQueues.filter((q) => q.service_type === loket.type);
            const waiting = rawQueues.filter((q) => q.status === "waiting");
            const calledRaw = rawQueues.filter((q) => q.status === "called" || q.status === "processing");
            const latestCalled = calledRaw.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
            const completed = rawQueues
              .filter((q) => ["completed", "done", "served"].includes(q.status))
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
            let activeQueue: Queue | null = null;
            
            if (latestCalled) { activeQueue = latestCalled; } 
            else if (completed.length > 0) {
                if (waiting.length > 0) {
                    const lastCompleted = completed[0];
                    const firstWaiting = waiting[0];
                    const completedTime = new Date(lastCompleted.updated_at || lastCompleted.created_at).getTime();
                    const waitingTime = new Date(firstWaiting.created_at).getTime();
                    if (completedTime < waitingTime) { activeQueue = firstWaiting; } 
                    else { activeQueue = lastCompleted; }
                } else { activeQueue = null; }
            } else if (waiting.length > 0) {
                activeQueue = waiting[0];
            }

            const info = SERVICE_INFO[activeQueue?.service_type || loket.type];
            const queueNumber = activeQueue?.queue_number || 0;
            const isCalled = activeQueue && (activeQueue.status === "called" || activeQueue.status === "processing");
            const baseNeon = NEON_COLORS[loket.type] || "border-blue-400";
            const magicHex = MAGIC_HEX[loket.type] || "#2563EB";

            return (
              <motion.div
                key={loket.id}
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="w-full flex-1 flex flex-col"
              >
                {/* Header */}
                <div className="flex h-8 w-full mb-1 relative drop-shadow-md items-center z-20">
                    <div className="relative flex-grow h-full flex items-center">
                        <svg viewBox="0 0 277 46" fill="none" className="absolute left-0 top-0 h-full w-[85%] max-w-none text-[#044EEB]" preserveAspectRatio="none">
                            <path d="M276.178 21.2256L248.282 45.2295H0V0H251.511L276.178 21.2256Z" fill="currentColor" />
                        </svg>
                        <span className="relative z-10 text-white font-bold text-sm pl-4 tracking-wider uppercase">LOKET {loket.id}</span>
                    </div>
                    <motion.svg 
                        width="56" height="48" viewBox="0 0 56 46" fill="none" 
                        className={`absolute -right-[2px] top-0 h-8 w-auto z-10 ${loket.arrowColor}`}
                        animate={isCalled ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                    >
                        <path d="M55.0547 21.2256L27.1592 45.2295H0L27.8945 21.2266L3.22559 0H30.3867L55.0547 21.2256Z" fill="currentColor" />
                    </motion.svg>
                </div>
                
                {/* --- MAGIC CARD WRAPPER --- */}
                <div className="relative -mt-1 group flex-grow rounded-xl z-10"> 
                  <AnimatePresence mode="wait">
                    <motion.div
                        key={activeQueue?.id || "empty"} 
                        initial={{ x: "-100vw", opacity: 0 }} 
                        animate={{ x: 0, opacity: 1, scale: isCalled ? 1.05 : 1 }}
                        exit={{ x: "-100vw", opacity: 0 }} 
                        transition={{ type: "spring", stiffness: 120, damping: 15, mass: 1 }}
                        className={`relative w-full h-full rounded-xl overflow-hidden
                          ${activeQueue && !isCalled ? `border-l-4 border-2 ${baseNeon}` : ""} 
                          ${!activeQueue ? "border-l-4 border-blue-400 shadow-lg opacity-90" : ""}
                        `}
                    >
                        {/* 1. SPINNER DI BELAKANG (Bikin border jalan) */}
                        {isCalled && (
                           <motion.div 
                             className="absolute inset-[-150%]"
                             animate={{ rotate: 360 }}
                             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                             style={{
                               background: `conic-gradient(from 0deg, transparent 0deg, ${magicHex} 90deg, transparent 180deg, ${magicHex} 270deg, transparent 360deg)`
                             }}
                           />
                        )}

                        {/* 2. KONTEN DI DEPAN (Inset dikit biar border keliatan) */}
                        <div className={`absolute ${isCalled ? "inset-[6px]" : "inset-0"} bg-blue-600 rounded-lg flex flex-col justify-center items-center z-20`}>
                             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-lg pointer-events-none"></div>
                             
                             <p className="text-5xl font-sans font-black mb-1 tracking-wide leading-none z-10 drop-shadow-sm text-white">
                               {queueNumber === 0 ? "---" : `${info?.title} ${String(queueNumber).padStart(3, "0")}`}
                             </p>
                             <p className="text-white font-bold text-[10px] tracking-[0.1em] uppercase z-10 opacity-90 border-t border-white/30 pt-2 w-full truncate text-center">
                               {info?.desc || "Layanan"}
                             </p>
                        </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {/* VIDEO & FOOTER TETAP SAMA */}
        <div className="col-span-9 h-full relative">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative rounded-3xl overflow-hidden shadow-2xl border-[6px] border-blue-600/30 bg-black">
            <video className="w-full h-full object-cover opacity-90" autoPlay loop playsInline muted>
              <source src="/videos/KING-QSH-HAO.mp4" type="video/mp4" />
            </video>
            <div className="absolute top-0 left-0 w-20 h-20 border-t-8 border-l-8 border-white/40 rounded-tl-xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 border-b-8 border-r-8 border-white/40 rounded-br-xl pointer-events-none"></div>
          </motion.div>
        </div>
      </div>

      <div className="h-24 grid grid-cols-12 gap-8 shrink-0">
          <div className="col-span-3"></div>
          <div className="col-span-9 h-full">
              <div className="h-full w-full bg-white/60 backdrop-blur-xl rounded-2xl border-2 border-white/40 shadow-lg flex items-center justify-between px-8 relative overflow-hidden">
                 <div className="flex flex-col justify-center border-r-2 border-gray-400/30 pr-6 h-full"><span className="text-gray-500 font-bold text-[10px] tracking-[0.3em] mb-0.5">OFFICIAL</span><span className="text-blue-900 font-black text-2xl tracking-tighter">PARTNERS</span></div>
                 <div className="flex items-center gap-10 grayscale opacity-80 mix-blend-multiply flex-grow justify-center">
                    <img src="/bca.png" className="h-10 w-auto object-contain" alt="BCA" /><div className="w-[1px] h-6 bg-gray-400/30"></div>
                    <img src="/bni.png" className="h-6 w-auto object-contain" alt="BNI" /><div className="w-[1px] h-6 bg-gray-400/30"></div>
                    <img src="/indomaret.png" className="h-8 w-auto object-contain" alt="Indomaret" /><div className="w-[1px] h-6 bg-gray-400/30"></div>
                    <span className="text-gray-400 font-bold text-lg italic font-serif">Bank BJB</span>
                 </div>
              </div>
          </div>
      </div>
    </div>
  );
}

function RunningText({ content }: { content: string }) {
  return (
    <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-4 left-0 w-full z-50 h-16 bg-[#C40000] flex flex-col justify-between py-1.5 shadow-2xl">
      <div className="w-full h-[3px] bg-white opacity-90" />
      <div className="flex-1 flex items-center overflow-hidden relative bg-[#C40000]">
        <motion.div initial={{ x: "100%" }} animate={{ x: "-100%" }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="whitespace-nowrap absolute">
          <span className="text-white font-bold text-2xl uppercase tracking-[0.2em] drop-shadow-sm font-sans">{content}</span>
        </motion.div>
      </div>
      <div className="w-full h-[3px] bg-white opacity-90" />
    </motion.div>
  );
}