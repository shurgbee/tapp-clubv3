const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface CreatePostRequest {
  event_id: string;
  poster_id: string;
  title: string;
  description?: string;
}

interface PostResponse {
  post_id: string;
  event_id: string;
  poster_id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface AddPostPictureRequest {
  uploader_id: string;
  picture_url: string;
}

interface PostPictureResponse {
  picture_id: string;
  post_id: string;
  picture_url: string;
  uploaded_at: string;
}

/**
 * Create a new post for an event
 */
export async function createPost(
  data: CreatePostRequest
): Promise<PostResponse> {
  console.log("[API] Creating post:", data);

  const response = await fetch(`${API_URL}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to create post" }));
    throw new Error(
      error.detail || `Failed to create post: ${response.status}`
    );
  }

  const result = await response.json();
  console.log("[API] Post created:", result);
  return result;
}

/**
 * Add a picture to a post
 */
export async function addPostPicture(
  postId: string,
  data: AddPostPictureRequest
): Promise<PostPictureResponse> {
  console.log(`[API] Adding picture to post ${postId}:`, data);

  const response = await fetch(`${API_URL}/posts/${postId}/pictures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to add picture" }));
    throw new Error(
      error.detail || `Failed to add picture: ${response.status}`
    );
  }

  const result = await response.json();
  console.log("[API] Picture added:", result);
  return result;
}

/**
 * Add a picture to an event
 */
export async function addEventPicture(
  eventId: string,
  data: AddPostPictureRequest
): Promise<PostPictureResponse> {
  console.log(`[API] Adding picture to event ${eventId}:`, data);

  const response = await fetch(`${API_URL}/events/${eventId}/pictures`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Failed to add picture" }));
    throw new Error(
      error.detail || `Failed to add picture: ${response.status}`
    );
  }

  const result = await response.json();
  console.log("[API] Picture added to event:", result);
  return result;
}
