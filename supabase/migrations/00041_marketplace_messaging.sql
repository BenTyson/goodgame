-- Migration: Marketplace Messaging
-- In-app messaging for buyers and sellers

-- ============================================
-- MARKETPLACE CONVERSATIONS
-- ============================================
-- A conversation thread between buyer and seller about a listing

CREATE TABLE marketplace_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Conversation state
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  -- Unread counts for each participant
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,

  -- Archived flags (hide from inbox without deleting)
  buyer_archived BOOLEAN DEFAULT FALSE,
  seller_archived BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Only one conversation per buyer per listing
  UNIQUE(listing_id, buyer_id)
);

-- Indexes
CREATE INDEX idx_conversations_buyer ON marketplace_conversations(buyer_id, buyer_archived, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON marketplace_conversations(seller_id, seller_archived, last_message_at DESC);
CREATE INDEX idx_conversations_listing ON marketplace_conversations(listing_id);

-- Trigger for updated_at
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON marketplace_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE marketplace_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they're part of
CREATE POLICY "Users can view own conversations"
  ON marketplace_conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Users can create conversations (as buyer only)
CREATE POLICY "Users can create conversations as buyer"
  ON marketplace_conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id AND auth.uid() != seller_id);

-- Users can update their own archive/read status
CREATE POLICY "Users can update own conversation status"
  ON marketplace_conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- ============================================
-- MARKETPLACE MESSAGES
-- ============================================

CREATE TABLE marketplace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES marketplace_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL,

  -- Read status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Soft delete (for moderation)
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,

  -- System messages (offer accepted, etc.)
  is_system_message BOOLEAN DEFAULT FALSE,
  system_message_type VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON marketplace_messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON marketplace_messages(sender_id);
CREATE INDEX idx_messages_unread ON marketplace_messages(conversation_id, is_read) WHERE is_read = FALSE;

-- RLS
ALTER TABLE marketplace_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON marketplace_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_conversations c
      WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON marketplace_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM marketplace_conversations c
      WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
  ON marketplace_messages FOR UPDATE
  USING (
    -- Can only mark as read, not modify content
    EXISTS (
      SELECT 1 FROM marketplace_conversations c
      WHERE c.id = marketplace_messages.conversation_id
        AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update conversation when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_record marketplace_conversations%ROWTYPE;
BEGIN
  -- Get conversation details
  SELECT * INTO conv_record FROM marketplace_conversations WHERE id = NEW.conversation_id;

  -- Update conversation
  UPDATE marketplace_conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    -- Increment unread count for the other participant
    buyer_unread_count = CASE
      WHEN NEW.sender_id = conv_record.seller_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN NEW.sender_id = conv_record.buyer_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON marketplace_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Create notification when new message received
CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  conv_record marketplace_conversations%ROWTYPE;
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO conv_record FROM marketplace_conversations WHERE id = NEW.conversation_id;

  -- Determine recipient (the person who didn't send the message)
  recipient_id := CASE
    WHEN NEW.sender_id = conv_record.buyer_id THEN conv_record.seller_id
    ELSE conv_record.buyer_id
  END;

  -- Get sender name
  SELECT COALESCE(display_name, username, 'Someone') INTO sender_name
  FROM user_profiles WHERE id = NEW.sender_id;

  -- Create notification (skip for system messages)
  IF NOT NEW.is_system_message THEN
    INSERT INTO user_notifications (user_id, notification_type, from_user_id, message)
    VALUES (
      recipient_id,
      'new_message',
      NEW.sender_id,
      sender_name || ' sent you a message'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message_notification
  AFTER INSERT ON marketplace_messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Mark all messages in a conversation as read for a user
CREATE OR REPLACE FUNCTION mark_conversation_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
  conv_record marketplace_conversations%ROWTYPE;
BEGIN
  -- Get conversation to verify user is participant
  SELECT * INTO conv_record FROM marketplace_conversations WHERE id = p_conversation_id;

  IF conv_record IS NULL THEN
    RAISE EXCEPTION 'Conversation not found';
  END IF;

  IF p_user_id != conv_record.buyer_id AND p_user_id != conv_record.seller_id THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  -- Mark messages as read (messages NOT from this user)
  UPDATE marketplace_messages
  SET is_read = TRUE, read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;

  -- Reset unread count for this user
  IF p_user_id = conv_record.buyer_id THEN
    UPDATE marketplace_conversations SET buyer_unread_count = 0 WHERE id = p_conversation_id;
  ELSE
    UPDATE marketplace_conversations SET seller_unread_count = 0 WHERE id = p_conversation_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get or create conversation for a listing
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_listing_id UUID,
  p_buyer_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_seller_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT id INTO v_conversation_id
  FROM marketplace_conversations
  WHERE listing_id = p_listing_id AND buyer_id = p_buyer_id;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Get seller ID from listing
  SELECT seller_id INTO v_seller_id
  FROM marketplace_listings
  WHERE id = p_listing_id;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_seller_id = p_buyer_id THEN
    RAISE EXCEPTION 'Cannot message yourself';
  END IF;

  -- Create new conversation
  INSERT INTO marketplace_conversations (listing_id, buyer_id, seller_id)
  VALUES (p_listing_id, p_buyer_id, v_seller_id)
  RETURNING id INTO v_conversation_id;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE marketplace_conversations IS 'Message threads between buyers and sellers';
COMMENT ON TABLE marketplace_messages IS 'Individual messages within conversations';
COMMENT ON FUNCTION mark_conversation_read IS 'Mark all messages in a conversation as read for a user';
COMMENT ON FUNCTION get_or_create_conversation IS 'Get existing or create new conversation for a listing';
