"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

// --- CONFIG SERVICE ---
// Urutan: TKA -> AK1 -> JKP -> LAINNYA (Id tetap MEDIASI biar aman)
const SERVICES = [
  {
    id: "TKA",
    name: "LAPOR TENAGA KERJA ASING",
    description: "Pelaporan tenaga kerja asing dan perizinan",
    color: "bg-purple-500",
  },
  {
    id: "AK1",
    name: "AK1 KARTU PENCARI KERJA",
    description: "Pembuatan dan legalisir kartu kuning (AK1)",
    color: "bg-blue-500",
  },
  {
    id: "JKP",
    name: "JKP (JAMINAN KEHILANGAN PEKERJAAN)",
    description: "Klaim manfaat jaminan kehilangan pekerjaan",
    color: "bg-green-500",
  },
  {
    id: "MEDIASI", // <--- ID TETAP 'MEDIASI' (BIAR DATABASE GAK ERROR)
    name: "LAINNYA (INFORMASI & PENGADUAN)", // <--- NAMA DIGANTI
    description: "Layanan pengaduan, konsultasi, dan informasi umum", // <--- DESKRIPSI DISESUAIKAN
    color: "bg-orange-500",
  },
]

export default function QueuePage() {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleServiceSelect = async (serviceId: string) => {
    setIsGenerating(true)

    try {
      const supabase = createClient()

      // Logic tetap jalan lancar karena kita kirim 'MEDIASI' ke database
      // Database taunya ini antrian Mediasi (MDS), tapi user taunya ini 'Lainnya'
      const { data: counterData, error: counterError } = await supabase.rpc("get_next_queue_number", {
        p_service_type: serviceId,
      })

      if (counterError) throw counterError

      const queueNumber = counterData

      const { data: queueData, error: queueError } = await supabase
        .from("queues")
        .insert({
          queue_number: queueNumber,
          service_type: serviceId,
          status: "waiting",
        })
        .select()
        .single()

      if (queueError) throw queueError

      router.push(`/queue/ticket/${queueData.id}`)
    } catch (error) {
      console.error("[waduh] Error creating queue:", error)
      alert("Terjadi kesalahan saat membuat antrian. Silakan coba lagi.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <img src="/images/disnaker-ijo.png" alt="Disnaker Logo" className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-blue-600">PILIH LAYANAN</h1>
              <p className="text-sm text-gray-600">Sistem Antrian Digital</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pilih Jenis Layanan</h2>
          <p className="text-lg text-gray-600">Silakan pilih layanan yang Anda butuhkan</p>
        </div>

        {/* Grid Card */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {SERVICES.map((service) => (
            <Card
              key={service.id}
              className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-blue-500"
              onClick={() => !isGenerating && handleServiceSelect(service.id)}
            >
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-16 h-16 ${service.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {/* Logic Icon / Singkatan */}
                    <span className="text-2xl font-bold text-white">
                      {service.id === "AK1" ? "AK1" 
                        : service.id === "MEDIASI" ? "?" // Kalau Lainnya kasih tanda tanya atau 'L'
                        : service.id.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Mencetak Tiket Antrian...</p>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}