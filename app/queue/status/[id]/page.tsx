import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import QueueStatus from "@/components/queue-status"

export default async function QueueStatusPage({
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

  // Get queues ahead
  const { count: queuesAhead } = await supabase
    .from("queues")
    .select("*", { count: "exact", head: true })
    .eq("service_type", queue.service_type)
    .eq("status", "waiting")
    .lt("queue_number", queue.queue_number)

  return <QueueStatus queue={queue} queuesAhead={queuesAhead || 0} />
}
