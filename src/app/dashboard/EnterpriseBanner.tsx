import Link from 'next/link'
import { createServiceClient, getEffectivePlan } from '@/lib/teams'

export default async function EnterpriseBanner({ userId }: { userId: string }) {
  let renewalDate: string | null = null
  let maxSeats = 10
  let usedSeats = 0
  let hasTeam = false
  let hasApiKey = false

  try {
    const effectivePlan = await getEffectivePlan(userId)
    if (effectivePlan !== 'enterprise') return null

    const serviceClient = createServiceClient()

    const [subRes, teamRes, apiKeyRes] = await Promise.all([
      serviceClient
        .from('subscriptions')
        .select('current_period_end')
        .eq('user_id', userId)
        .maybeSingle(),
      serviceClient
        .from('teams')
        .select('id, max_seats')
        .eq('owner_id', userId)
        .maybeSingle(),
      serviceClient
        .from('api_keys')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ])

    renewalDate = (subRes.data as { current_period_end?: string | null } | null)?.current_period_end ?? null

    if (teamRes.data) {
      hasTeam = true
      const teamId = (teamRes.data as { id: string; max_seats?: number | null }).id
      const rawMax = (teamRes.data as { id: string; max_seats?: number | null }).max_seats
      maxSeats = rawMax ?? 10

      const { count } = await serviceClient
        .from('team_members')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)
        .eq('status', 'active')

      usedSeats = count ?? 0
    }

    hasApiKey = (apiKeyRes.count ?? 0) > 0
  } catch {
    return null
  }

  const renewalLabel = renewalDate
    ? `Renews ${new Date(renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Active'

  const seatPct = maxSeats > 0 ? Math.min(Math.round((usedSeats / maxSeats) * 100), 100) : 0

  return (
    <div className="bg-gradient-to-r from-[#1a0a0a] to-[#171717] border border-red-900/30 border-l-2 border-l-red-500 rounded-2xl p-5 mb-6 font-jakarta">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

        {/* Plan Status */}
        <div>
          <div className="text-[#888888] text-xs mb-2">Plan</div>
          <span className="inline-block bg-red-900/30 border border-red-800/40 text-red-400 text-xs font-medium px-2.5 py-0.5 rounded-full mb-1.5">
            Enterprise Plan
          </span>
          <div className="text-[#888888] text-xs">{renewalLabel}</div>
        </div>

        {/* Seats */}
        <div>
          <div className="text-[#888888] text-xs mb-2">Team Seats</div>
          {hasTeam ? (
            <>
              <div className="text-[#e5e2e1] text-sm font-medium mb-2">
                {usedSeats} of {maxSeats} seats used
              </div>
              <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${seatPct}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-[#888888] text-sm">
              0 of {maxSeats} seats ·{' '}
              <Link href="/dashboard/team" className="text-red-400 hover:text-red-300 transition-colors">
                Set up your team →
              </Link>
            </div>
          )}
        </div>

        {/* API Access */}
        <div>
          <div className="text-[#888888] text-xs mb-2">API Access</div>
          {hasApiKey ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-[#e5e2e1] text-sm font-medium">API Key Active</span>
            </div>
          ) : (
            <div className="text-[#888888] text-sm">
              No API Key ·{' '}
              <Link href="/dashboard#api-key" className="text-red-400 hover:text-red-300 transition-colors">
                Generate one →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
