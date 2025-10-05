const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";

export interface ChatMessage {
  poster_id: string;
  poster_name: string;
  messageType: string;
  messageContent: string;
  dateTime: string;
}

export interface GroupPreview {
  group_id: string;
  group_name: string;
  pfp?: string;
  last_message_content?: string;
  last_message_timestamp?: string;
  last_message_poster_name?: string;
}

export interface SendMessageRequest {
  user_id: string;
  messageType: string;
  messageContent: string;
}

export interface GroupCreateRequest {
  creator_id: string;
  name: string;
  pfp?: string;
  initial_member_ids: string[];
}

export interface GroupCreateResponse {
  group_id: string;
  name: string;
  pfp?: string;
}

export interface GroupMember {
  user_id: string;
  username: string;
  pfp?: string;
}

/**
 * Get all groups/conversations for a user
 */
export async function getUserConversations(
  userId: string
): Promise<GroupPreview[]> {
  const url = `${API_BASE_URL}/users/${userId}/groups`;
  console.log("[API] Fetching user conversations:", url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch conversations: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("[API] Conversations fetched:", data);
    return data;
  } catch (error) {
    console.error("[API] Error fetching user conversations:", error);
    throw error;
  }
}

/**
 * Get messages from a specific group conversation
 */
export async function getGroupMessages(
  groupId: string
): Promise<ChatMessage[]> {
  const url = `${API_BASE_URL}/groups/${groupId}/conversations`;
  console.log("[API] Fetching group messages:", url);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch messages: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("[API] Messages fetched:", data);
    // Messages come in reverse order (newest first), so reverse them for chat UI
    return data.reverse();
  } catch (error) {
    console.error("[API] Error fetching group messages:", error);
    throw error;
  }
}

/**
 * Send a message to a group
 */
export async function sendMessage(
  groupId: string,
  message: SendMessageRequest
): Promise<ChatMessage> {
  const url = `${API_BASE_URL}/groups/${groupId}/conversations`;
  console.log("[API] Sending message:", url, message);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to send message" }));
      throw new Error(
        error.detail || `Failed to send message: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("[API] Message sent:", data);
    return data;
  } catch (error) {
    console.error("[API] Error sending message:", error);
    throw error;
  }
}

/**
 * Create a new group conversation
 */
export async function createGroup(
  groupData: GroupCreateRequest
): Promise<GroupCreateResponse> {
  const url = `${API_BASE_URL}/groups`;
  console.log("[API] Creating group:", url, groupData);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to create group" }));
      throw new Error(
        error.detail || `Failed to create group: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("[API] Group created:", data);
    return data;
  } catch (error) {
    console.error("[API] Error creating group:", error);
    throw error;
  }
}

/**
 * Add members to an existing group
 */
export async function addMembersToGroup(
  groupId: string,
  userIds: string[]
): Promise<{ message: string; added_count: number }> {
  const url = `${API_BASE_URL}/groups/${groupId}/members`;
  console.log("[API] Adding members to group:", url, { user_ids: userIds });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_ids: userIds }),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to add members" }));
      throw new Error(
        error.detail || `Failed to add members: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("[API] Members added:", data);
    return data;
  } catch (error) {
    console.error("[API] Error adding members to group:", error);
    throw error;
  }
}
