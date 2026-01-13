import { createClient } from "@/lib/supabase/server"
import GuestBookList from "@/components/guest-book-list"

export default async function AdminGuestBookPage() {
  const supabase = await createClient()

  const { data: guests } = await supabase
    .from("guest_book")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  return <GuestBookList guests={guests || []} />
}
