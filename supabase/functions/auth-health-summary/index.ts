import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthHealthSummary {
  event: 'auth_health_summary'
  timestamp: string
  stats: {
    otp: { attempts: number; successes: number; timeouts: number; lockouts: number }
    signInFailuresByReason: Record<string, number>
    passwordResets: { requested: number; completed: number }
    captcha: { triggered: number; passed: number; failed: number }
    topFailingIps: { cidr: string; failures: number }[]
    lockouts: { userId: string; email?: string | null }[]
    configDrift: {
      accessTokenTTL?: string | null
      refreshTokenRotation?: boolean | null
      rateLimits?: Record<string, unknown>
    }
    actionItems: string[]
  }
}

async function maybeSendEmail(subject: string, message: string) {
  try {
    const enabled = (Deno.env.get('ENABLE_EMAIL_ALERTS') || 'false').toLowerCase() === 'true'
    const apiKey = Deno.env.get('RESEND_API_KEY')
    const to = Deno.env.get('ALERT_EMAIL_TO')
    const from = Deno.env.get('ALERT_EMAIL_FROM') || 'alerts@harrisboatworks.local'

    // Always log what we would send
    console.log(JSON.stringify({
      event: 'auth_health_email_hook',
      mode: enabled ? 'email' : 'log-only',
      subject,
      preview: message.slice(0, 2000),
      timestamp: new Date().toISOString(),
    }))

    if (!enabled || !apiKey || !to) return

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        subject,
        html: `<pre>${message.replace(/</g, '&lt;')}</pre>`
      })
    })
    if (!res.ok) {
      console.error('Failed to send summary email', await res.text())
    }
  } catch (e) {
    console.error('Email hook error', e)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Placeholder summary (can be enriched later with real metrics)
    const summary: AuthHealthSummary = {
      event: 'auth_health_summary',
      timestamp: new Date().toISOString(),
      stats: {
        otp: { attempts: 0, successes: 0, timeouts: 0, lockouts: 0 },
        signInFailuresByReason: {},
        passwordResets: { requested: 0, completed: 0 },
        captcha: { triggered: 0, passed: 0, failed: 0 },
        topFailingIps: [],
        lockouts: [],
        configDrift: {
          accessTokenTTL: null,
          refreshTokenRotation: null,
          rateLimits: {},
        },
        actionItems: [],
      },
    }

    // Structured log for the dashboard
    console.log(JSON.stringify(summary))

    // Optional email hook (disabled by default)
    await maybeSendEmail('HBW Auth Health Summary', JSON.stringify(summary, null, 2))

    return new Response(JSON.stringify({ success: true, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Auth health summary error', error)
    console.error(JSON.stringify({
      event: 'auth_health_summary_error',
      message: (error as any)?.message || 'Unknown error',
      stack: (error as any)?.stack || null,
      timestamp: new Date().toISOString(),
    }))

    // Best-effort email hook
    await maybeSendEmail('HBW Auth Health Summary FAILED', (error as any)?.message || 'Unknown error')

    return new Response(JSON.stringify({ success: false, error: (error as any)?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
