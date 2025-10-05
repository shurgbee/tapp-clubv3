const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.example.com";

export interface UserProfile {
  user_id: string;
  username: string;
  pfp: string;
  description: string;
  friend_count: number;
  event_count: number;
  latest_events: {
    event_id: string;
    name: string;
    description: string;
    location: string;
    dateTime: string;
    first_picture_url: string;
  }[];
}

export interface EventDetails {
  event_id: string;
  name: string;
  description: string;
  location: string;
  dateTime: string;
  attendees: {
    user_id: string;
    username: string;
    pfp: string;
  }[];
  pictures: {
    picture_id: string;
    picture_url: string;
    uploader_id: string;
    uploader_name: string;
    uploaded_at: string;
  }[];
}

// Helper function to log API requests
function logRequest(method: string, url: string, body?: any) {
  console.log(`🌐 API Request: ${method} ${url}`);
  if (body) {
    console.log("📤 Request Body:", JSON.stringify(body, null, 2));
  }
}

// Helper function to log API responses
function logResponse(url: string, status: number, data?: any) {
  const statusEmoji = status >= 200 && status < 300 ? "✅" : "❌";
  console.log(`${statusEmoji} API Response: ${status} - ${url}`);
  if (data) {
    console.log("📥 Response Data:", JSON.stringify(data, null, 2));
  }
}

// Helper function to log API errors
function logError(url: string, error: any) {
  console.error("🔴 API Error:", url);
  console.error("Error details:", error);
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const url = `${API_BASE_URL}/users/${userId}/profile`;
  const startTime = Date.now();

  logRequest("GET", url);

  try {
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    console.log(`⏱️  Request completed in ${duration}ms`);

    if (!response.ok) {
      logResponse(url, response.status);
      throw new Error(
        `Failed to fetch user profile: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    logResponse(url, response.status, data);

    return data;
  } catch (error) {
    logError(url, error);
    throw error;
  }
}

export async function getEventDetails(eventId: string): Promise<EventDetails> {
  const url = `${API_BASE_URL}/events/${eventId}`;
  const startTime = Date.now();

  logRequest("GET", url);

  try {
    const response = await fetch(url);
    const duration = Date.now() - startTime;

    console.log(`⏱️  Request completed in ${duration}ms`);

    if (!response.ok) {
      logResponse(url, response.status);
      throw new Error(
        `Failed to fetch event details: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    logResponse(url, response.status, data);

    return data;
  } catch (error) {
    logError(url, error);
    throw error;
  }
}
