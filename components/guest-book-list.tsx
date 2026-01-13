"use client"

import { useState } from "react" // 1. Import useState
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowLeft, User, Download, ChevronDown, Calendar, History } from "lucide-react"
import Link from "next/link"
import * as XLSX from "xlsx"

interface Guest {
  id: string
  name: string
  institution: string
  purpose: string
  phone: string
  photo_url: string | null
  created_at: string
}

interface GuestBookListProps {
  guests: Guest[]
}

export default function GuestBookList({ guests }: GuestBookListProps) {
  // 2. State untuk Filter Tampilan (Default: 'today' biar pas buka langsung liat yg hari ini)
  const [viewFilter, setViewFilter] = useState<"today" | "all">("today")

  // 3. Logic Filter Data untuk TAMPILAN WEB
  const filteredGuests = guests.filter((guest) => {
    if (viewFilter === "all") return true
    
    // Cek tanggal hari ini
    const todayStr = new Date().toDateString()
    const guestDate = new Date(guest.created_at).toDateString()
    return guestDate === todayStr
  })

  // Fungsi Export (Tetap bisa milih manual, atau mau ngikutin filter juga bisa)
  const handleExport = (type: "today" | "all") => {
    let dataToProcess = guests

    if (type === "today") {
      const todayStr = new Date().toDateString()
      dataToProcess = guests.filter((guest) => {
        const guestDate = new Date(guest.created_at).toDateString()
        return guestDate === todayStr
      })
    }

    if (dataToProcess.length === 0) {
      alert("Data kosong untuk filter ini!")
      return
    }

    const dataToExport = dataToProcess.map((guest) => ({
      "Nama Lengkap": guest.name,
      "Instansi": guest.institution,
      "No. Telepon": guest.phone,
      "Keperluan": guest.purpose,
      "Waktu Berkunjung": new Date(guest.created_at).toLocaleString("id-ID", {
        dateStyle: "full",
        timeStyle: "short",
      }),
      "Link Foto": guest.photo_url ? guest.photo_url : "-",
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    
    // Atur lebar kolom
    worksheet["!cols"] = [
      { wch: 25 }, { wch: 20 }, { wch: 15 }, 
      { wch: 30 }, { wch: 25 }, { wch: 50 },
    ]

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Tamu")
    const fileLabel = type === "today" ? "HARI_INI" : "SEMUA_DATA"
    const dateStr = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `Data_Tamu_${fileLabel}_${dateStr}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-blue-600">DATA BUKU TAMU</h1>
              <p className="text-sm text-gray-600">
                {viewFilter === "today" ? "Daftar Pengunjung Hari Ini" : "Semua Riwayat Pengunjung"}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Download className="w-4 h-4" />
                Export Excel
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("today")}>
                Export Hari Ini Saja
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("all")}>
                Export Semua Data (History)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        
        {/* 4. TOMBOL FILTER / TABS */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border w-fit shadow-sm">
          <Button 
            variant={viewFilter === "today" ? "default" : "ghost"}
            onClick={() => setViewFilter("today")}
            className={viewFilter === "today" ? "bg-blue-600 text-white" : "text-gray-600"}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Hari Ini
          </Button>
          <Button 
            variant={viewFilter === "all" ? "default" : "ghost"}
            onClick={() => setViewFilter("all")}
            className={viewFilter === "all" ? "bg-blue-600 text-white" : "text-gray-600"}
          >
            <History className="w-4 h-4 mr-2" />
            Semua Data
          </Button>
        </div>

        <Card>
          <CardHeader>
            {/* Judul Kartu berubah sesuai filter */}
            <CardTitle className="flex justify-between items-center">
              <span>
                {viewFilter === "today" ? "Pengunjung Hari Ini" : "Total Semua Pengunjung"}
              </span>
              <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                {filteredGuests.length} Orang
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              {/* 5. Render pakai filteredGuests, bukan guests biasa */}
              {filteredGuests.map((guest) => (
                <Card key={guest.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        {guest.photo_url ? (
                          <img
                            src={guest.photo_url || "/placeholder.svg"}
                            alt={guest.name}
                            className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-gray-600">Nama</p>
                            <p className="font-semibold text-lg">{guest.name}</p>
                          </div>
                          {/* Label Tanggal biar jelas pas mode 'All' */}
                          <div className="text-right">
                             <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded text-gray-600">
                               {new Date(guest.created_at).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}
                             </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Instansi</p>
                            <p className="font-medium">{guest.institution}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">No. Telepon</p>
                            <p className="font-medium">{guest.phone}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Keperluan</p>
                          <p className="font-medium">{guest.purpose}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">
                             Jam Masuk: {new Date(guest.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredGuests.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <p className="text-gray-500 font-medium">
                    {viewFilter === "today" 
                      ? "Belum ada tamu hari ini, santai dulu bro! ☕" 
                      : "Belum ada data sama sekali."}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}