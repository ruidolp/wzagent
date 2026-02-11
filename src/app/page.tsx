import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">WIRC</h1>
        <p className="text-xl mb-8">WhatsApp Integration & Response Center</p>
        <Link
          href="/admin/tenants"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Go to Admin
        </Link>
      </div>
    </main>
  )
}
