-- Friends system schema
-- Run this SQL in Supabase SQL Editor after running the Drizzle migration

-- Create partial unique index for pending friend requests
-- This ensures only one pending request can exist between two users
CREATE UNIQUE INDEX IF NOT EXISTS friend_requests_pending_unique 
ON friend_requests (requester_id, receiver_id) 
WHERE status = 'pending';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS friendships_user_id_idx ON friendships(user_id);
CREATE INDEX IF NOT EXISTS friendships_friend_id_idx ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS friend_requests_requester_id_idx ON friend_requests(requester_id);
CREATE INDEX IF NOT EXISTS friend_requests_receiver_id_idx ON friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS friend_requests_status_idx ON friend_requests(status);

