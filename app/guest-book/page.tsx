"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Building2,
  User,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Pilihan Cepat Keperluan
const PURPOSE_OPTIONS = [
  "Mediasi",
  "Bertemu Pejabat/Staf",
  "Konsultasi Layanan",
  "Membuat AK1",
  "Melamar Magang/Kerja",
  "Surat Pemberitahuan PHK",
  "Lainnya",
];

export default function GuestBookPage() {
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    purpose: "",
    phone: "",
  });

  // State Logic UI
  const [isPersonal, setIsPersonal] = useState(false);
  const [selectedPurposeChip, setSelectedPurposeChip] = useState("");
  
  // === STATE BARU: DATA INSTANSI LIVE DARI DB ===
  const [dbInstitutions, setDbInstitutions] = useState<string[]>([]); // Data mentah dari DB
  const [filteredInstitutions, setFilteredInstitutions] = useState<string[]>([]); // Data hasil filter ketikan
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Ref Kamera
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const supabase = createClient();

  // === 1. FETCH DATA INSTANSI PAS LOAD PAGE ===
  useEffect(() => {
    fetchInstitutions();
  }, []);

  const fetchInstitutions = async () => {
    // Ambil semua nama instansi yang udah tersimpan
    const { data } = await supabase
      .from("institutions")
      .select("name")
      .order("name", { ascending: true });
    
    if (data) {
      setDbInstitutions(data.map((item) => item.name));
    }
  };

  // === LOGIC KAMERA (Tetap sama) ===
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => console.error("Play error:", e));
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser tidak support kamera");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (error: any) {
      setCameraError("Gagal akses kamera: " + (error.message || "Unknown error"));
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext("2d");
        if (!context) return;
        const { videoWidth, videoHeight } = videoRef.current;
        if (!videoWidth) throw new Error("Video belum siap.");
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        context.translate(videoWidth, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
        setPhotoUrl(canvasRef.current.toDataURL("image/jpeg", 0.9));
        stopCamera();
      } catch (error) {
        setCameraError("Gagal mengambil foto. Coba lagi.");
      }
    }
  };

  // === LOGIC AUTOCOMPLETE LIVE ===
  const handleInstitutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, institution: value });

    // Filter dari data DB yang udah di-fetch
    if (value.length > 0) {
      const filtered = dbInstitutions.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredInstitutions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectInstitution = (value: string) => {
    setFormData({ ...formData, institution: value });
    setShowSuggestions(false);
  };

  const handlePersonalCheck = (checked: boolean) => {
    setIsPersonal(checked);
    setShowSuggestions(false);
    if (checked) {
      setFormData((prev) => ({ ...prev, institution: "-" }));
    } else {
      setFormData((prev) => ({ ...prev, institution: "" }));
    }
  };

  const handlePurposeChip = (option: string) => {
    setSelectedPurposeChip(option);
    if (option !== "Lainnya") {
      setFormData((prev) => ({ ...prev, purpose: option }));
    } else {
      setFormData((prev) => ({ ...prev, purpose: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let uploadedPhotoUrl = null;

      // 1. Upload Foto
      if (photoUrl) {
        const res = await fetch(photoUrl);
        const blob = await res.blob();
        const fileName = `guest-${Date.now()}.jpg`;
        const { data } = await supabase.storage
          .from("guest-photos")
          .upload(fileName, blob, { contentType: "image/jpeg" });
        
        if (data) {
          const { data: urlData } = supabase.storage
            .from("guest-photos")
            .getPublicUrl(data.path);
          uploadedPhotoUrl = urlData.publicUrl;
        }
      }

      // 2. Simpan Data Buku Tamu
      const { error } = await supabase.from("guest_book").insert({
        name: formData.name,
        institution: formData.institution,
        purpose: formData.purpose,
        phone: formData.phone,
        photo_url: uploadedPhotoUrl,
      });

      if (error) throw error;

      // === 3. FITUR "SELF LEARNING" ===
      // Kalau bukan pribadi, simpan nama PT ke tabel 'institutions' secara diam-diam
      if (!isPersonal && formData.institution) {
        // Upsert: Coba insert, kalau nama udah ada (conflict), abaikan aja (ignoreDuplicates)
        await supabase
          .from("institutions")
          .upsert(
            { name: formData.institution }, 
            { onConflict: 'name', ignoreDuplicates: true }
          );
          
        // Refresh data lokal biar nama baru langsung muncul di saran berikutnya
        fetchInstitutions(); 
      }

      setIsSuccess(true);
      setTimeout(() => {
        setFormData({ name: "", institution: "", purpose: "", phone: "" });
        setPhotoUrl(null);
        setIsSuccess(false);
        setIsPersonal(false);
        setSelectedPurposeChip("");
        setFilteredInstitutions([]);
      }, 3000);
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-12 text-center shadow-xl border-blue-100">
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6 animate-bounce" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Terima Kasih!</h2>
          <p className="text-lg text-gray-600">Data kunjungan Anda telah berhasil disimpan.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-blue-50 text-blue-600">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <img src="/disnaker logo png.svg" alt="Disnaker Logo" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-blue-600 leading-tight">BUKU TAMU DIGITAL</h1>
              <p className="text-xs text-gray-500">Disnaker Kota Bandung</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Card className="max-w-2xl mx-auto shadow-xl border-blue-100 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Formulir Kunjungan</h2>
              <p className="text-gray-600 text-sm">Mohon lengkapi data diri dan ambil foto untuk verifikasi.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* AREA KAMERA (Tetap) */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Foto Wajah <span className="text-red-500">*</span></Label>
                {cameraError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800 font-medium">{cameraError}</p>
                  </div>
                )}
                <div className="flex flex-col items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-300">
                  {!photoUrl && !isCameraActive && (
                    <div className="text-center py-8 w-full">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-8 h-8" />
                      </div>
                      <Button type="button" onClick={startCamera} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
                        Buka Kamera
                      </Button>
                    </div>
                  )}
                  {isCameraActive && (
                    <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                      <div className="relative rounded-xl overflow-hidden border-4 border-gray-900 bg-black shadow-lg aspect-video">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                      </div>
                      <div className="flex gap-3 justify-center">
                        <Button type="button" onClick={capturePhoto} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                          <Camera className="w-4 h-4 mr-2" /> Jepret Foto
                        </Button>
                        <Button type="button" onClick={stopCamera} variant="destructive">Batal</Button>
                      </div>
                    </div>
                  )}
                  {photoUrl && (
                    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="relative rounded-xl overflow-hidden border-4 border-green-500 shadow-lg aspect-video group">
                        <img src={photoUrl} alt="Captured" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-semibold flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Foto Siap</p>
                        </div>
                      </div>
                      <Button type="button" onClick={() => { setPhotoUrl(null); startCamera(); }} variant="outline" className="w-full border-gray-300">
                        <RefreshCw className="w-4 h-4 mr-2" /> Foto Ulang
                      </Button>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              </div>

              {/* FORM FIELDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="Masukan Nama Lengkap" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">No. Telepon <span className="text-red-500">*</span></Label>
                  <Input id="phone" type="tel" inputMode="numeric" placeholder="Contoh: 0812..." required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-11" />
                </div>
              </div>

              {/* === AUTOCOMPLETE LIVE DARI DB === */}
              <div className="space-y-3 relative">
                <div className="flex items-center justify-between">
                  <Label htmlFor="institution">Instansi/Perusahaan <span className="text-red-500">*</span></Label>
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={isPersonal} onChange={(e) => handlePersonalCheck(e.target.checked)} />
                    <span className="text-sm font-medium text-gray-600">Kunjungan Pribadi</span>
                  </label>
                </div>
                
                <div className="relative">
                  <Input
                    id="institution"
                    placeholder={isPersonal ? "Pribadi (Non-Instansi)" : "Ketik nama instansi..."}
                    required
                    disabled={isPersonal}
                    value={isPersonal ? "Pribadi (Non-Instansi)" : formData.institution}
                    onChange={handleInstitutionChange}
                    onFocus={() => !isPersonal && formData.institution && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className={`h-11 transition-colors pr-10 ${isPersonal ? 'bg-gray-100 text-gray-500' : ''}`}
                    autoComplete="off"
                  />
                  
                  {isPersonal ? (
                    <User className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  ) : (
                    <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  )}

                  {/* DAFTAR SARAN LIVE */}
                  {showSuggestions && filteredInstitutions.length > 0 && !isPersonal && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                      <ul className="py-1">
                        {filteredInstitutions.map((item, index) => (
                          <li
                            key={index}
                            onClick={() => selectInstitution(item)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-0 flex items-center gap-2"
                          >
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* CHIPS KEPERLUAN */}
              <div className="space-y-3">
                <Label htmlFor="purpose">Keperluan Kunjungan <span className="text-red-500">*</span></Label>
                <div className="flex flex-wrap gap-2">
                  {PURPOSE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handlePurposeChip(option)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        selectedPurposeChip === option
                          ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-blue-300"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {selectedPurposeChip === "Lainnya" && (
                  <Textarea
                    id="purpose"
                    placeholder="Silakan jelaskan keperluan kunjungan Anda..."
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    rows={3}
                    className="resize-none animate-in fade-in slide-in-from-top-2"
                    autoFocus
                  />
                )}
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold shadow-lg shadow-blue-200 rounded-xl mt-6" disabled={isSubmitting || !photoUrl}>
                {isSubmitting ? "Sedang Menyimpan..." : "Simpan Buku Tamu"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}