"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Lock, Mail, Loader2, ArrowRight } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError("Email atau password salah.")
        return
      }

      if (data.session) {
        localStorage.setItem("adminSession", JSON.stringify(data.session))
        router.push("/admin")
      }
    } catch (err) {
      setError("Terjadi kesalahan sistem")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-b-[50%] scale-x-150 shadow-md -z-10"></div>
      
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        
        <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm">
          
          {/* BAGIAN 1: LOGO (Clean White Background) */}
          <div className="py-0 flex items-center justify-center bg-white">
             <img 
                src="/images/disnaker-ijo.png" 
                alt="Disnaker Logo" 
                className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300" 
             />
          </div>

          {/* BAGIAN 2: GARIS GRADIENT PEMISAH */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600"></div>

          {/* BAGIAN 3: JUDUL & FORM */}
          <CardContent className="p-8 pt-8">
            
            {/* Judul ADMINISTRATOR (Sekarang disini) */}
            <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight uppercase">Administrator</h1>
                <p className="text-xs text-gray-400 font-medium mt-1">Sistem Antrian Disnaker Kota Bandung</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-pulse">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 ml-1 uppercase tracking-wide">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@disnaker.go.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-gray-50/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 ml-1 uppercase tracking-wide">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-gray-50/50 focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading} 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-blue-200 shadow-lg transition-all mt-6"
              >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memproses...
                    </>
                ) : (
                    <>
                        Masuk Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                )}
              </Button>
            </form>
          </CardContent>
          
          {/* Footer Card */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-100">
             <p className="text-[10px] text-gray-400">
                &copy; {new Date().getFullYear()} Dinas Tenaga Kerja Kota Bandung
             </p>
          </div>

        </Card>
      </div>
    </div>
  )
}