"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle, MapPin, Star, Volume2 } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Queue {
  id: string
  queue_number: number
  service_type: string
  status: string
  counter_number: number | null
  created_at: string
}

interface QueueStatusProps {
  queue: Queue
  queuesAhead: number
}

const STATUS_CONFIG = {
  waiting: {
    icon: Clock,
    text: "Menunggu Giliran",
    theme: "blue",
    bgClass: "bg-blue-50",
    textClass: "text-blue-600",
    borderClass: "border-blue-100",
    description: "Mohon menunggu di ruang tunggu",
  },
  called: {
    icon: Volume2,
    text: "Panggilan!",
    theme: "orange",
    bgClass: "bg-orange-50",
    textClass: "text-orange-600",
    borderClass: "border-orange-200 animate-pulse",
    description: "Segera menuju loket layanan",
  },
  completed: {
    icon: CheckCircle,
    text: "Layanan Selesai",
    theme: "green",
    bgClass: "bg-green-50",
    textClass: "text-green-600",
    borderClass: "border-green-100",
    description: "Terima kasih telah berkunjung",
  },
  cancelled: {
    icon: AlertCircle,
    text: "Dibatalkan",
    theme: "red",
    bgClass: "bg-red-50",
    textClass: "text-red-600",
    borderClass: "border-red-100",
    description: "Antrian anda telah dibatalkan",
  },
}

export default function QueueStatus({ queue: initialQueue, queuesAhead: initialQueuesAhead }: QueueStatusProps) {
  const [queue, setQueue] = useState(initialQueue)
  const [queuesAhead, setQueuesAhead] = useState(initialQueuesAhead)
  const [greeting, setGreeting] = useState("Selamat Datang")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 3 && hour < 11) setGreeting("Selamat Pagi")
    else if (hour >= 11 && hour < 15) setGreeting("Selamat Siang")
    else if (hour >= 15 && hour < 18) setGreeting("Selamat Sore")
    else setGreeting("Selamat Malam")
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`queue-${queue.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "queues",
          filter: `id=eq.${queue.id}`,
        },
        (payload) => setQueue(payload.new as Queue)
      )
      .subscribe()

    const interval = setInterval(async () => {
      if (queue.status === 'waiting') {
        const { count } = await supabase
            .from("queues")
            .select("*", { count: "exact", head: true })
            .eq("service_type", queue.service_type)
            .eq("status", "waiting")
            .lt("queue_number", queue.queue_number)
        setQueuesAhead(count || 0)
      }
    }, 5000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [queue.id, queue.service_type, queue.queue_number, queue.status])

  const statusConfig = STATUS_CONFIG[queue.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.waiting
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative overflow-x-hidden pb-10">
      
      {/* Header sama persis kayak sebelumnya */}
      <div className={`h-48 rounded-b-[3rem] shadow-md relative transition-all duration-500
        ${queue.status === 'called' ? 'bg-gradient-to-br from-orange-400 to-amber-500' : 
          queue.status === 'completed' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
          'bg-gradient-to-br from-blue-500 to-cyan-500'}
      `}>
        <div className="absolute top-6 right-8 text-white font-medium text-sm opacity-90">
          {greeting}
        </div>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
           <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        </div>
      </div>

      <main className="container mx-auto px-6 -mt-28 relative z-10 flex flex-col items-center">
        
        {/* Disini bedanya: Logo Card-nya gw hapus, gw pindahin gambarnya ke dalem Card di bawah */}

        {/* Kartu Utama */}
        <Card className={`w-full max-w-md p-0 overflow-hidden shadow-xl rounded-3xl transition-all duration-300 ${statusConfig.borderClass} border-2`}>
          
          <div className="p-8 flex flex-col items-center text-center bg-white">
            
            {/* === LOGO DISINI === */}
            {/* Langsung nyatu sama konten, ga pake kotak terpisah lagi */}
            <img 
              src="/images/logo-disnaker-anton.png"
              alt="Disnaker Logo" 
              className="h-14 w-auto object-contain mb-8" 
            />

            {/* Status Badge */}
            <div className={`flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full ${statusConfig.bgClass} ${statusConfig.textClass}`}>
                {queue.status === 'waiting' && (
                  <span className="relative flex h-2.5 w-2.5 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current"></span>
                  </span>
                )}
                <span className="text-xs font-bold uppercase tracking-wide">{statusConfig.text}</span>
            </div>
            
            {/* KASUS 1: DIPANGGIL */}
            {queue.status === 'called' && (
                <div className="animate-in zoom-in duration-300 mb-8 w-full">
                    <div className="mb-4 relative inline-block">
                        <div className="absolute inset-0 bg-orange-200 rounded-full animate-ping opacity-20"></div>
                        <Volume2 className="w-16 h-16 text-orange-500 mx-auto relative z-10 animate-bounce" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-2">GILIRAN ANDA!</h3>
                    <p className="text-gray-500 mb-6">{statusConfig.description}</p>
                    
                    {queue.counter_number && (
                        <div className="bg-orange-50 border-2 border-orange-100 rounded-xl p-4 w-full">
                            <p className="text-sm text-orange-600 font-semibold uppercase mb-1">Silakan Menuju</p>
                            <div className="text-4xl font-black text-gray-800 flex items-center justify-center gap-2">
                                <MapPin className="w-6 h-6 text-orange-500" />
                                LOKET {queue.counter_number}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* KASUS 2: SELESAI */}
            {queue.status === 'completed' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6 w-full">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Pelayanan Selesai</h3>
                    <p className="text-gray-500 text-sm mb-6 px-4">
                        Terima kasih telah menggunakan layanan Disnaker Kota Bandung.
                    </p>
                    
                    {/* Tombol SKM */}
                    <div className="w-full mt-4">
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 shadow-green-200 shadow-lg h-12 text-md">
                            <Star className="w-5 h-5" />
                            Isi Survei Kepuasan (SKM)
                        </Button>
                    </div>
                </div>
            )}

            {/* KASUS 3: MENUNGGU */}
            {queue.status === 'waiting' && (
                <div className="mb-8 w-full">
                    <h3 className="text-5xl font-bold text-gray-800 mb-1 tracking-tight">{queuesAhead}</h3>
                    <p className="text-gray-500 font-medium">Orang di depan Anda</p>
                    
                    <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 leading-relaxed">
                            💡 Tips: Anda tidak perlu refresh halaman. Notifikasi akan muncul otomatis saat nomor dipanggil.
                        </p>
                    </div>
                </div>
            )}

            {/* Footer Token Number */}
            {queue.status !== 'completed' && queue.status !== 'cancelled' && (
                <>
                    <hr className="w-full border-gray-100 mb-6" />
                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Nomor Antrian Anda</p>
                        <div className="text-5xl font-black text-gray-900 tracking-tighter">
                            {queue.service_type}-{String(queue.queue_number).padStart(3, "0")}
                        </div>
                    </div>
                </>
            )}

          </div>
        </Card>

        {/* Footer Credit */}
        <div className="mt-8 text-center">
             <p className="text-xs text-gray-400 mb-1">Dinas Tenaga Kerja Kota Bandung</p>
             <p className="text-[10px] text-gray-300">© {new Date().getFullYear()} Sistem Antrian Digital</p>
        </div>

      </main>
    </div>
  )
}