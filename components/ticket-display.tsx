"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";

interface Queue {
  id: string;
  queue_number: number;
  service_type: string;
  created_at: string;
}

interface TicketDisplayProps {
  queue: Queue;
  position: number;
}

const SERVICE_NAMES: Record<string, string> = {
  AK1: "AK1 KARTU PENCARI KERJA",
  JKP: "JKP (JAMINAN KEHILANGAN PEKERJAAN)",
  MEDIASI: "MEDIASI",
  TKA: "LAPOR TENAGA KERJA ASING",
};

export default function TicketDisplay({ queue, position }: TicketDisplayProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, " - "));
    setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
  }, []);

  useEffect(() => {
    if (qrCanvasRef.current) {
      const qrUrl = `${window.location.origin}/queue/status/${queue.id}`;
      QRCode.toCanvas(qrCanvasRef.current, qrUrl, { width: 120, margin: 0 });
    }
    const printTimer = setTimeout(() => window.print(), 800);
    const redirectTimer = setTimeout(() => router.push("/"), 5000);
    return () => { clearTimeout(printTimer); clearTimeout(redirectTimer); };
  }, [queue.id, router]);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0 print:h-auto">
      
      {/* Header Web */}
      <header className="bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/queue"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <h1 className="text-xl font-bold text-blue-600">TIKET ANTRIAN</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2"><Printer className="w-4 h-4" /> Cetak Manual</Button>
            <Link href="/"><Button variant="outline" className="gap-2 bg-transparent"><Home className="w-4 h-4" /> Beranda</Button></Link>
          </div>
        </div>
      </header>

      {/* --- KONTEN TIKET --- */}
      <main className="container mx-auto py-12 flex items-center justify-center print:block print:w-full print:m-0 print:p-0 print:pt-0 print:h-auto">
        
        <Card className="ticket-animate w-full max-w-md bg-white p-6 shadow-lg relative overflow-hidden print:shadow-none print:border-none print:rounded-none print:w-[80mm] print:mx-auto print:p-0 print:pb-0 print:h-auto">
          
          {/* 1. Header Tanggal (DITARIK HILANG PARAH KE ATAS) */}
          {/* print:-mt-24 = Ini bakal narik Tanggal & "DISNAKER" ilang ke atas */}
          <div className="flex justify-between items-center mb-0 font-bold text-xs text-gray-800 border-b-2 border-transparent print:text-[10px] print:mb-0 print:-mt-24">
            <span>{currentDate}</span>
            <span>{currentTime}</span>
          </div>

          {/* 2. Logo */}
          {/* print:-mt-4 = Biar logo tetep nempel rapet sama elemen atasnya yang udah naik */}
          <div className="text-center mb-0 print:-mt-4">
            <img 
              src="/logo-disnaker-anton.png" 
              alt="Disnaker Logo" 
              className="h-16 w-auto mx-auto object-contain print:h-12" 
            />
          </div>

          {/* 3. Layanan */}
          <div className="text-center mb-0 print:mb-0 print:-mt-4">
            <p className="text-sm font-semibold text-gray-500 mb-0 print:text-[10px] print:text-black">Layanan</p>
            <h3 className="text-lg font-bold text-black uppercase leading-tight print:text-sm print:font-black">
              {SERVICE_NAMES[queue.service_type]}
            </h3>
          </div>

          {/* 4. Nomor Antrian */}
          <div className="text-center mb-0 print:mb-0 print:-mt-4">
            <p className="text-sm font-semibold text-gray-500 mb-0 print:text-[10px] print:text-black">Nomor Antrian</p>
            <div className="text-7xl font-black text-black tracking-wide leading-none print:text-6xl print:leading-[0.85]">
              {queue.service_type}{String(queue.queue_number).padStart(3, "0")}
            </div>
          </div>

          {/* Garis Putus */}
          <div className="w-full border-t-2 border-dashed border-gray-300 my-0 print:my-0 print:border-gray-400 print:-mt-4"></div>

          {/* 5. QR Code */}
          <div className="flex flex-col items-center justify-center mb-0 print:mb-0 print:-mt-3">
            <canvas ref={qrCanvasRef} className="print:w-[100px] print:h-[100px]" />
          </div>

          {/* 6. Footer */}
          <div className="text-center space-y-0 print:pb-0">
            <p className="text-xs text-gray-600 print:text-[9px] print:text-black print:leading-[0.8] -mt-[10px]">
              Pindai kode QR ini untuk melihat status antrean saat ini.
            </p>
            <p className="text-xs font-semibold text-gray-800 print:text-[9px] print:text-black print:leading-tight print:mt-[8px]">
              Harap menunggu panggilan dari petugas
            </p>
            <p className="text-xs font-semibold text-gray-800 print:text-[9px] print:text-black print:leading-tight print:mb-0">
              Terimakasih atas kunjungan Anda
            </p>
          </div>

        </Card>
      </main>

      <style jsx global>{`
        @keyframes popUp { 0% { opacity: 0; transform: scale(0.95) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .ticket-animate { animation: popUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @keyframes shrinkWidth { from { width: 100%; } to { width: 0%; } }
        .progress-bar { animation: shrinkWidth 5s linear forwards; }

        @media print {
          @page {
            size: 80mm auto; 
            margin: 0mm; 
          }
          html, body {
            height: auto !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .container {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          header, footer, .hidden-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color: black !important; }
        }
      `}</style>
    </div>
  );
}