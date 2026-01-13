import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import TicketDisplay from "@/components/ticket-display"

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch queue data
  const { data: queue, error } = await supabase.from("queues").select("*").eq("id", id).single()

  if (error || !queue) {
    redirect("/queue")
  }

  // Get total waiting queues for the same service type
  const { count: totalWaiting } = await supabase
    .from("queues")
    .select("*", { count: "exact", head: true })
    .eq("service_type", queue.service_type)
    .eq("status", "waiting")
    .lte("queue_number", queue.queue_number)

  return <TicketDisplay queue={queue} position={totalWaiting || 1} />
}
