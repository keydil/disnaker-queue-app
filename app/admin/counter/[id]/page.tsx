import CounterControl from "@/components/counter-control"

export default async function CounterPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const counterNumber = Number.parseInt(id)

  return <CounterControl counterNumber={counterNumber} />
}
