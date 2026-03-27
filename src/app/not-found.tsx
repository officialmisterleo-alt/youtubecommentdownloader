import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
      <div className="text-[#333333] text-8xl font-bold mb-4 select-none">404</div>
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-[#888888] text-sm mb-8 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
