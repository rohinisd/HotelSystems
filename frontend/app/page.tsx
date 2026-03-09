import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Hotel Management System
      </h1>
      <p className="text-gray-600 mb-8">
        Book rooms and manage your stay.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Login
        </Link>
        <Link
          href="/dashboard"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          View Hotels
        </Link>
      </div>
    </main>
  );
}
