/**
 * Marketplace Conversation Queries
 *
 * Query functions for marketplace messaging system.
 */

import { createClient, createAdminClient } from './server'

export interface ConversationPreview {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  last_message_at: string | null
  last_message_preview: string | null
  buyer_unread_count: number
  seller_unread_count: number
  created_at: string
  // Joined data
  listing: {
    id: string
    game: {
      name: string
      thumbnail_url: string | null
    }
  }
  other_user: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
  }
  unread_count: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  read_at: string | null
  is_system_message: boolean
  system_message_type: string | null
  created_at: string
  // Joined data
  sender?: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
  }
}

export interface ConversationWithMessages {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  created_at: string
  listing: {
    id: string
    listing_type: string
    price_cents: number | null
    game: {
      id: string
      name: string
      slug: string
      thumbnail_url: string | null
    }
  }
  other_user: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    custom_avatar_url: string | null
  }
  messages: Message[]
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(userId: string): Promise<ConversationPreview[]> {
  const supabase = await createClient()

  // Get conversations where user is buyer or seller
  const { data: conversations, error } = await supabase
    .from('marketplace_conversations')
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      last_message_at,
      last_message_preview,
      buyer_unread_count,
      seller_unread_count,
      buyer_archived,
      seller_archived,
      created_at,
      listing:marketplace_listings!inner(
        id,
        game:games!inner(
          name,
          thumbnail_url
        )
      )
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  if (!conversations) return []

  // Filter out archived conversations and fetch other user data
  const visibleConversations = conversations.filter((c) => {
    const isBuyer = c.buyer_id === userId
    return isBuyer ? !c.buyer_archived : !c.seller_archived
  })

  // Get other user IDs
  const otherUserIds = visibleConversations.map((c) =>
    c.buyer_id === userId ? c.seller_id : c.buyer_id
  )

  // Fetch other users
  const { data: users } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, custom_avatar_url')
    .in('id', otherUserIds)

  const userMap = new Map(users?.map((u) => [u.id, u]) || [])

  return visibleConversations.map((c) => {
    const isBuyer = c.buyer_id === userId
    const otherUserId = isBuyer ? c.seller_id : c.buyer_id
    const otherUser = userMap.get(otherUserId)

    return {
      id: c.id,
      listing_id: c.listing_id,
      buyer_id: c.buyer_id,
      seller_id: c.seller_id,
      last_message_at: c.last_message_at,
      last_message_preview: c.last_message_preview,
      buyer_unread_count: c.buyer_unread_count ?? 0,
      seller_unread_count: c.seller_unread_count ?? 0,
      created_at: c.created_at ?? new Date().toISOString(),
      listing: c.listing as ConversationPreview['listing'],
      other_user: otherUser || {
        id: otherUserId,
        username: null,
        display_name: null,
        avatar_url: null,
        custom_avatar_url: null,
      },
      unread_count: (isBuyer ? c.buyer_unread_count : c.seller_unread_count) ?? 0,
    }
  })
}

/**
 * Get a single conversation with messages
 */
export async function getConversationWithMessages(
  conversationId: string,
  userId: string
): Promise<ConversationWithMessages | null> {
  const supabase = await createClient()

  // Get conversation
  const { data: conversation, error: convError } = await supabase
    .from('marketplace_conversations')
    .select(`
      id,
      listing_id,
      buyer_id,
      seller_id,
      created_at,
      listing:marketplace_listings!inner(
        id,
        listing_type,
        price_cents,
        game:games!inner(
          id,
          name,
          slug,
          thumbnail_url
        )
      )
    `)
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    console.error('Error fetching conversation:', convError)
    return null
  }

  // Verify user is participant
  if (conversation.buyer_id !== userId && conversation.seller_id !== userId) {
    return null
  }

  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from('marketplace_messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      is_read,
      read_at,
      is_system_message,
      system_message_type,
      created_at,
      sender:user_profiles!sender_id(
        id,
        username,
        display_name,
        avatar_url,
        custom_avatar_url
      )
    `)
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })

  if (msgError) {
    console.error('Error fetching messages:', msgError)
    return null
  }

  // Get other user
  const otherUserId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id
  const { data: otherUser } = await supabase
    .from('user_profiles')
    .select('id, username, display_name, avatar_url, custom_avatar_url')
    .eq('id', otherUserId)
    .single()

  return {
    id: conversation.id,
    listing_id: conversation.listing_id,
    buyer_id: conversation.buyer_id,
    seller_id: conversation.seller_id,
    created_at: conversation.created_at ?? new Date().toISOString(),
    listing: conversation.listing as ConversationWithMessages['listing'],
    other_user: otherUser || {
      id: otherUserId,
      username: null,
      display_name: null,
      avatar_url: null,
      custom_avatar_url: null,
    },
    messages: (messages || []).map((m) => ({
      id: m.id,
      conversation_id: m.conversation_id,
      sender_id: m.sender_id,
      content: m.content,
      is_read: m.is_read ?? false,
      read_at: m.read_at,
      is_system_message: m.is_system_message ?? false,
      system_message_type: m.system_message_type,
      created_at: m.created_at ?? new Date().toISOString(),
      sender: m.sender as Message['sender'],
    })),
  }
}

/**
 * Get or create a conversation for a listing
 */
export async function getOrCreateConversation(
  listingId: string,
  buyerId: string
): Promise<string | null> {
  const adminClient = createAdminClient()

  const { data, error } = await adminClient.rpc('get_or_create_conversation', {
    p_listing_id: listingId,
    p_buyer_id: buyerId,
  })

  if (error) {
    console.error('Error getting/creating conversation:', error)
    return null
  }

  return data
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('marketplace_messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: content.trim(),
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      content,
      is_read,
      read_at,
      is_system_message,
      system_message_type,
      created_at
    `)
    .single()

  if (error || !data) {
    console.error('Error sending message:', error)
    return null
  }

  return {
    id: data.id,
    conversation_id: data.conversation_id,
    sender_id: data.sender_id,
    content: data.content,
    is_read: data.is_read ?? false,
    read_at: data.read_at,
    is_system_message: data.is_system_message ?? false,
    system_message_type: data.system_message_type,
    created_at: data.created_at ?? new Date().toISOString(),
  }
}

/**
 * Mark conversation as read
 */
export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const adminClient = createAdminClient()

  const { error } = await adminClient.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  })

  if (error) {
    console.error('Error marking conversation read:', error)
    return false
  }

  return true
}

/**
 * Get total unread message count for a user
 */
export async function getUnreadMessageCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data: conversations, error } = await supabase
    .from('marketplace_conversations')
    .select('buyer_id, seller_id, buyer_unread_count, seller_unread_count')
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

  if (error || !conversations) {
    return 0
  }

  return conversations.reduce((total, c) => {
    const isBuyer = c.buyer_id === userId
    return total + ((isBuyer ? c.buyer_unread_count : c.seller_unread_count) ?? 0)
  }, 0)
}

/**
 * Archive a conversation (hide from inbox)
 */
export async function archiveConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient()

  // First check if user is buyer or seller
  const { data: conv } = await supabase
    .from('marketplace_conversations')
    .select('buyer_id, seller_id')
    .eq('id', conversationId)
    .single()

  if (!conv) return false

  const isBuyer = conv.buyer_id === userId
  const updateField = isBuyer ? 'buyer_archived' : 'seller_archived'

  const { error } = await supabase
    .from('marketplace_conversations')
    .update({ [updateField]: true })
    .eq('id', conversationId)

  return !error
}
