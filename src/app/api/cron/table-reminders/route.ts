/**
 * Table Reminder Cron Endpoint
 *
 * POST /api/cron/table-reminders
 *
 * Triggered by cron-job.org to send reminder notifications
 * for tables starting within the next hour.
 *
 * Headers:
 *   x-cron-secret: Required, must match CRON_SECRET env var
 */

import { NextRequest } from 'next/server'
import { verifyCronAuth, unauthorizedResponse, jsonResponse, errorResponse } from '@/lib/api/auth'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60 // Allow up to 1 minute

// Use service role client for cron jobs
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials for service role')
  }

  return createClient(supabaseUrl, serviceKey)
}

interface TableNeedingReminder {
  table_id: string
  title: string | null
  scheduled_at: string
  game_name: string
  host_id: string
  host_display_name: string | null
  participant_ids: string[]
}

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronAuth(request)) {
    return unauthorizedResponse()
  }

  try {
    const supabase = getServiceClient()

    // Get tables needing reminders (starting within 60 minutes)
    const { data: tables, error: fetchError } = await supabase
      .rpc('get_tables_needing_reminders', { p_minutes_ahead: 60 })

    if (fetchError) {
      console.error('Error fetching tables for reminders:', fetchError)
      return errorResponse('Failed to fetch tables', 500)
    }

    if (!tables || tables.length === 0) {
      return jsonResponse({
        success: true,
        message: 'No tables need reminders',
        processed: 0,
        timestamp: new Date().toISOString(),
      })
    }

    let notificationsSent = 0
    let tablesProcessed = 0
    const errors: string[] = []

    // Process each table
    for (const table of tables as TableNeedingReminder[]) {
      try {
        // Create notifications for all participants
        const participantIds = table.participant_ids || []

        if (participantIds.length > 0) {
          const notifications = participantIds.map((userId) => ({
            user_id: userId,
            type: 'table_starting' as const,
            actor_id: table.host_id,
            game_id: null, // Game ID would need to be added to the query if needed
            metadata: {
              table_id: table.table_id,
              table_title: table.title || table.game_name,
              game_name: table.game_name,
              scheduled_at: table.scheduled_at,
            },
            is_read: false,
          }))

          const { error: insertError } = await supabase
            .from('user_notifications')
            .insert(notifications)

          if (insertError) {
            console.error(`Error creating notifications for table ${table.table_id}:`, insertError)
            errors.push(`Table ${table.table_id}: ${insertError.message}`)
          } else {
            notificationsSent += participantIds.length
          }
        }

        // Mark reminder as sent
        const { error: markError } = await supabase
          .rpc('mark_table_reminder_sent', { p_table_id: table.table_id })

        if (markError) {
          console.error(`Error marking reminder sent for table ${table.table_id}:`, markError)
          errors.push(`Table ${table.table_id} mark: ${markError.message}`)
        } else {
          tablesProcessed++
        }
      } catch (tableError) {
        const errorMsg = tableError instanceof Error ? tableError.message : 'Unknown error'
        console.error(`Error processing table ${table.table_id}:`, tableError)
        errors.push(`Table ${table.table_id}: ${errorMsg}`)
      }
    }

    return jsonResponse({
      success: true,
      message: `Processed ${tablesProcessed} tables, sent ${notificationsSent} notifications`,
      tablesProcessed,
      notificationsSent,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in table reminders cron:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return errorResponse(errorMsg, 500)
  }
}

// Also support GET for health checks
export async function GET(request: NextRequest) {
  return jsonResponse({
    status: 'ok',
    endpoint: 'table-reminders',
    description: 'Sends notifications for tables starting within the next hour',
  })
}
