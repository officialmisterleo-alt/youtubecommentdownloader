import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = 'noreply@youtubecommentdownloader.com'
const APP_NAME = 'YouTube Comment Downloader'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://youtubecommentdownloader.com'

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="color:#dc2626;font-size:13px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">${APP_NAME}</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#555555;">
                <a href="${APP_URL}" style="color:#555555;text-decoration:none;">${APP_URL.replace(/^https?:\/\//, '')}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendTeamInviteEmail({
  toEmail,
  teamName,
  inviterEmail,
  joinUrl,
}: {
  toEmail: string
  teamName: string
  inviterEmail: string
  joinUrl: string
}) {
  const subject = `You've been invited to join ${teamName} on ${APP_NAME}`

  const html = baseHtml(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">You're invited!</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#888888;line-height:1.6;">
      <strong style="color:#ffffff;">${inviterEmail}</strong> has invited you to join
      <strong style="color:#ffffff;">${teamName}</strong> on ${APP_NAME}.
    </p>

    <div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:11px;color:#555555;text-transform:uppercase;letter-spacing:0.05em;">Team</p>
      <p style="margin:0;font-size:18px;font-weight:600;color:#ffffff;">${teamName}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${joinUrl}"
             style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 36px;border-radius:10px;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;font-size:13px;color:#555555;text-align:center;">
      Or copy this link into your browser:
    </p>
    <p style="margin:0 0 24px;font-size:12px;color:#555555;text-align:center;word-break:break-all;">
      <a href="${joinUrl}" style="color:#888888;">${joinUrl}</a>
    </p>

    <p style="margin:0;font-size:12px;color:#444444;text-align:center;">
      This invitation expires in 7 days. If you were not expecting this, you can safely ignore it.
    </p>
  `)

  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — would send team invite email:')
    console.log(`  To: ${toEmail}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Join URL: ${joinUrl}`)
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject,
    html,
  })

  if (error) throw new Error(`Failed to send invite email: ${error.message}`)
}

export async function sendMemberJoinedEmail({
  toEmail,
  teamName,
  memberEmail,
}: {
  toEmail: string
  teamName: string
  memberEmail: string
}) {
  const subject = `${memberEmail} has joined ${teamName}`

  const html = baseHtml(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">New team member</h1>
    <p style="margin:0 0 24px;font-size:14px;color:#888888;line-height:1.6;">
      <strong style="color:#ffffff;">${memberEmail}</strong> has accepted their invitation and joined
      <strong style="color:#ffffff;">${teamName}</strong>.
    </p>

    <div style="background:#0a0a0a;border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      <p style="margin:0 0 4px;font-size:11px;color:#555555;text-transform:uppercase;letter-spacing:0.05em;">New member</p>
      <p style="margin:0;font-size:16px;font-weight:600;color:#ffffff;">${memberEmail}</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${APP_URL}/dashboard"
             style="display:inline-block;background:#171717;border:1px solid rgba(255,255,255,0.08);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;">
            View Team
          </a>
        </td>
      </tr>
    </table>
  `)

  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — would send member joined email:')
    console.log(`  To: ${toEmail}`)
    console.log(`  Subject: ${subject}`)
    return
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject,
    html,
  })

  if (error) throw new Error(`Failed to send member joined email: ${error.message}`)
}
