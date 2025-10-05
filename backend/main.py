# main.py
import os
import uuid
import json
import requests
from datetime import datetime, timezone
from collections import defaultdict
from typing import List, Optional

import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
import uuid
# Load environment variables from .env file
load_dotenv()
from google import genai
from google.genai.types import (
    GenerateContentConfig,
    GoogleSearch,
    GoogleMaps,
    HttpOptions,
    Tool,
)
import base64
import os

try:
    # Initialize the Gemini client with API key
    # Use GEMINI_API_KEY for the public Gemini API (not Vertex AI)
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    client = genai.Client(api_key=GEMINI_API_KEY)
    
    MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    if not MAPS_API_KEY:
        raise ValueError("GOOGLE_MAPS_API_KEY not found in environment variables")
except Exception as e:
    raise RuntimeError(f"Failed to initialize clients: {e}")

# --- Configuration ---
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable not set.")

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Chat API",
    description="API for fetching user chats from a Neon database."
)
def search_places(query: str) -> str:
    """
    Finds places like restaurants or landmarks based on a search query.
    Returns a list of places with their names, addresses, and ratings.
    """
    try:
        url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&key={MAPS_API_KEY}"
        response = requests.get(url)
        places_result = response.json()
        
        if places_result and 'results' in places_result:
            top_places = places_result['results'][:5] # Keep it concise for the model
            formatted_places = [
                {
                    "name": place.get("name"),
                    "address": place.get("formatted_address"),
                    "rating": place.get("rating"),
                } for place in top_places
            ]
            return json.dumps(formatted_places)
        return "No places found."
    except Exception as e:
        return f"Error searching for places: {e}"

def search_info(query: str) -> str:
    """
    Provides up to date info from Google Search
    """
    response = client.models.generate_content(
        model='gemini-2.0-flash-exp',
        contents=query,
        config=GenerateContentConfig(
            tools=[Tool(google_search=GoogleSearch())],
            temperature=0.7,
        )
    )
    return response.text

def get_directions(origin: str, destination: str) -> str:
    """
    Provides step-by-step directions between an origin and a destination.
    Returns the duration, distance, and key steps for the route.
    """
    try:
        url = f"https://maps.googleapis.com/maps/api/directions/json?origin={origin}&destination={destination}&mode=driving&key={MAPS_API_KEY}"
        response = requests.get(url)
        directions_result = response.json()
        
        if directions_result and 'routes' in directions_result and directions_result['routes']:
            leg = directions_result['routes'][0]['legs'][0]
            summary = {
                "duration": leg['duration']['text'],
                "distance": leg['distance']['text'],
                "steps": [step['html_instructions'].replace("<b>", "").replace("</b>", "") for step in leg['steps'][:5]]
            }
            return json.dumps(summary)
        return "Could not find directions."
    except Exception as e:
        return f"Error getting directions: {e}"


# --- 3. CREATE THE MODULAR AGENT FUNCTION ---
# This is the core logic, encapsulated into a single, reusable function.

async def run_gemini_agent(prompt: str) -> str:
    """
    Runs the full agentic process with Gemini.

    Args:
        prompt: The user's input query.

    Returns:
        The final textual response from the agent.
    """
    try:
        # First, call Gemini with just Google Search grounding to get a smart response
        # that can access real-time information
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=GenerateContentConfig(
                #No maps stuff for now
                tools=[Tool(google_search=GoogleSearch())],
                temperature=0.7,
            )
        )
        
        # The response will include search-grounded results
        # which can answer most queries about places, directions, and general info
        return response.text
        
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

# --- Database Connection Pool ---
DB_POOL = None

@app.on_event("startup")
async def startup():
    global DB_POOL
    try:
        DB_POOL = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=10)
        print("Database connection pool created successfully.")
    except Exception as e:
        print(f"Error creating database connection pool: {e}")

@app.on_event("shutdown")
async def shutdown():
    if DB_POOL:
        await DB_POOL.close()
        print("Database connection pool closed.")

# ==================================================================
# --- FIX 1: RE-ADDED THE MISSING get_db_connection FUNCTION ---
# This function must be defined before the API endpoints that use it.
# ==================================================================
from typing import AsyncGenerator

async def get_db_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Dependency to get a connection from the pool."""
    if not DB_POOL:
        raise HTTPException(status_code=503, detail="Database connection pool is not available.")
    
    async with DB_POOL.acquire() as connection:
        yield connection


# --- Pydantic Models for Response Data ---
# ==================================================================
# --- FIX 2: RENAMED 'orm_mode' to 'from_attributes' ---
# This resolves the UserWarning from Pydantic V2.
# ==================================================================
class ChatMessage(BaseModel):
    poster_id: uuid.UUID
    poster_name: str
    messageType: str
    messageContent: str
    dateTime: datetime

    class Config:
        from_attributes = True # <-- UPDATED

class GroupChat(BaseModel):
    group_id: uuid.UUID
    group_name: str
    messages: List[ChatMessage]

    class Config:
        from_attributes = True # <-- UPDATED

class GroupPreview(BaseModel):
    group_id: uuid.UUID
    group_name: str
    pfp: Optional[uuid.UUID]
    last_message_content: Optional[str]
    last_message_timestamp: Optional[datetime]
    last_message_poster_name: Optional[str]

    class Config:
        from_attributes = True # <-- UPDATED

class SendMessageRequest(BaseModel):
    user_id: uuid.UUID
    messageType: str
    messageContent: str
# Add this to your main.py with the other models

class FriendRequestCreate(BaseModel):
    requester_id: uuid.UUID  # The user sending the request
    addressee_id: uuid.UUID  # The user receiving the request

    # Add this with your other models
from enum import Enum

class FriendRequestAction(str, Enum):
    ACCEPT = "accepted"
    DECLINE = "declined"

class FriendRequestUpdate(BaseModel):
    # The user who is accepting or declining the request.
    responder_id: uuid.UUID
    # The action they are taking.
    action: FriendRequestAction


# Add these new models to main.py

class EventPreview(BaseModel):
    event_id: uuid.UUID
    name: str
    description: str
    dateTime: datetime

    class Config:
        from_attributes = True

class UserProfile(BaseModel):
    user_id: uuid.UUID
    username: str
    pfp: Optional[uuid.UUID]
    description: Optional[str]
    friend_count: int
    event_count: int
    latest_events: List[EventPreview]

class AgentResponse(BaseModel):
    message: str
    dateTime: datetime
    links: List[str]
    

class EventPictureCreate(BaseModel):
    uploader_id: uuid.UUID
    picture_url: HttpUrl  # Pydantic will validate this is a proper URL

class EventPictureResponse(BaseModel):
    picture_id: uuid.UUID
    event_id: uuid.UUID
    uploader_id: uuid.UUID
    picture_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True
# --- API Endpoints ---
# In your main.py file, replace the get_user_groups function with this one:

@app.get("/users/{user_id}/groups", response_model=List[GroupPreview])
async def get_user_groups(
    user_id: uuid.UUID,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Gets a list of all groups a user is in. For each group, it fetches the
    very last message sent. The entire list is sorted by the timestamp of

    the last message, so the most recently active group is first.
    """
    query = """
        WITH latest_messages AS (
            SELECT DISTINCT ON (group_id)
                group_id,
                "user_id" AS poster_id,
                "messageContent",
                "dateTime"
            FROM conversations
            ORDER BY group_id, "dateTime" DESC
        )
        SELECT
            g.group_id,
            g.name AS group_name,
            g.pfp,
            lm."messageContent" AS last_message_content,
            lm."dateTime" AS last_message_timestamp,
            u.username AS last_message_poster_name
        FROM
            "groupMembers" gm
        JOIN
            groups g ON gm.group_id = g.group_id
        LEFT JOIN
            latest_messages lm ON g.group_id = lm.group_id
        LEFT JOIN
            users u ON lm.poster_id = u.user_id
        WHERE
            gm.user_id = $1
        ORDER BY
            last_message_timestamp DESC NULLS LAST;
    """
    try:
        rows = await db.fetch(query, user_id)
        
        # ==================================================================
        # --- FIX: Manually construct the Pydantic models from the rows ---
        # This resolves the Pydantic validation error.
        # ==================================================================
        response = []
        for row in rows:
            # The asyncpg 'row' object acts like a dictionary.
            # We map the keys from the row to the Pydantic model's fields.
            group_preview = GroupPreview(
                group_id=row['group_id'],
                group_name=row['group_name'],
                pfp=row['pfp'],
                last_message_content=row['last_message_content'],
                last_message_timestamp=row['last_message_timestamp'],
                last_message_poster_name=row['last_message_poster_name']
            )
            response.append(group_preview)
        
        return response
        
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@app.get("/groups/{group_id}/conversations", response_model=List[ChatMessage])
async def get_group_conversation(
    group_id: uuid.UUID,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Retrieves the latest 20 messages from a specific group conversation,
    ordered from most recent to oldest.
    """
    query = """
        SELECT
            c.user_id AS poster_id,
            u.username AS poster_name,
            c."messageType",
            c."messageContent",
            c."dateTime"
        FROM
            conversations c
        JOIN
            users u ON c.user_id = u.user_id
        WHERE
            c.group_id = $1
        ORDER BY
            c."dateTime" DESC
        LIMIT 20;
    """
    try:
        rows = await db.fetch(query, group_id)
        response = []
        for row in rows:
            chat_message = ChatMessage(
                poster_id=row['poster_id'],
                poster_name=row['poster_name'],
                messageType=row['messageType'],
                messageContent=row['messageContent'],
                dateTime=row['dateTime']
            )
            response.append(chat_message)
            
        return response

    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
    
@app.post("/groups/{group_id}/conversations", response_model=ChatMessage)
async def send_group_message(
    group_id: uuid.UUID,
    message: SendMessageRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Posts a new message from a user to a specific group.
    """
    # We use timezone.utc to ensure the timestamp is timezone-aware,
    # matching the TIMESTAMPTZ column type in your database.
    current_timestamp = datetime.now(timezone.utc)

    query = """
        INSERT INTO conversations (group_id, user_id, "messageType", "messageContent", "dateTime")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id AS poster_id, "messageType", "messageContent", "dateTime";
    """
    
    try:
        # Execute the INSERT query
        inserted_row = await db.fetchrow(
            query,
            group_id,
            message.user_id,
            message.messageType,
            message.messageContent,
            current_timestamp
        )

        if not inserted_row:
            raise HTTPException(status_code=500, detail="Failed to create message.")

        # To return the poster's name, we need to fetch it
        user_query = "SELECT username FROM users WHERE user_id = $1"
        user_record = await db.fetchrow(user_query, inserted_row['poster_id'])
        poster_name = user_record['username'] if user_record else "Unknown User"

        # Construct the response object matching the ChatMessage model
        response_message = ChatMessage(
            poster_id=inserted_row['poster_id'],
            poster_name=poster_name,
            messageType=inserted_row['messageType'],
            messageContent=inserted_row['messageContent'],
            dateTime=inserted_row['dateTime']
        )
        
        return response_message

    except asyncpg.exceptions.ForeignKeyViolationError:
        # This error happens if the group_id or user_id does not exist
        raise HTTPException(status_code=404, detail="Group or User not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


# Add this endpoint to your main.py

@app.post("/friend-requests", status_code=201)
async def send_friend_request(
    request: FriendRequestCreate,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Creates a new friend request.
    The request is stored as a 'pending' friendship.
    first person is sending,
    second is receiving.
    """
    requester_id = request.requester_id
    addressee_id = request.addressee_id

    # Rule 1: A user cannot send a request to themselves.
    if requester_id == addressee_id:
        raise HTTPException(status_code=400, detail="Cannot send a friend request to yourself.")

    # Rule 2: Enforce canonical order for user IDs to match the database constraint.
    user_one_id = min(requester_id, addressee_id)
    user_two_id = max(requester_id, addressee_id)
    
    query = """
        INSERT INTO friendships (user_one_id, user_two_id, status, action_user_id)
        VALUES ($1, $2, 'pending', $3)
        ON CONFLICT (user_one_id, user_two_id) DO NOTHING;
    """
    
    try:
        # The action_user_id is the person who initiated the request.
        result = await db.execute(query, user_one_id, user_two_id, requester_id)
        if "INSERT 0" in result:
             # This means no row was inserted, likely due to the ON CONFLICT clause.
            raise HTTPException(status_code=409, detail="A friendship or request already exists between these users.")
            
        return {"message": "Friend request sent successfully."}

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="One or both users not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    

    # Add this endpoint to your main.py

@app.patch("/friend-requests/{requester_id}", status_code=200)
async def update_friend_request(
    requester_id: uuid.UUID,
    update: FriendRequestUpdate,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Updates a pending friend request to either 'accepted' or 'declined'.
    The {requester_id} in the path is the user who originally sent the request.
    The user in the request body is the one responding.
    """
    responder_id = update.responder_id
    new_status = update.action.value # "accepted" or "declined"

    # Enforce canonical order for the WHERE clause.
    user_one_id = min(requester_id, responder_id)
    user_two_id = max(requester_id, responder_id)
    
    # This query updates the status only if a pending request exists
    # from the requester to the responder.
    query = """
        UPDATE friendships
        SET status = $1, action_user_id = $2, updated_at = NOW()
        WHERE
            user_one_id = $3
            AND user_two_id = $4
            AND status = 'pending'
            AND action_user_id = $5 -- Ensures the original sender is correct
        RETURNING status;
    """
    
    try:
        result = await db.fetchval(
            query,
            new_status,
            responder_id,
            user_one_id,
            user_two_id,
            requester_id
        )

        if result is None:
            # No rows were updated, meaning no matching pending request was found.
            raise HTTPException(status_code=404, detail="No pending friend request found to update.")

        action_word = "accepted" if new_status == "accepted" else "declined"
        return {"message": f"Friend request successfully {action_word}."}

    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    


    # Add this new endpoint to your main.py file

@app.get("/agent/", response_model=str)
async def getAgentResponse(
    request: str
):
    """
    Endpoint to interact with the Gemini agent.
    It takes a user prompt, gets the agent's response, and returns it.
    """
    if not request:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    
    try:
        # Call our modular agent function to handle the logic
        agent_response = await run_gemini_agent(request)
        return agent_response
    except Exception as e:
        # Handle potential errors gracefully
        raise HTTPException(status_code=500, detail=f"An internal error occurred: {str(e)}")
    return None


@app.get("/users/{user_id}/profile", response_model=UserProfile)
async def get_user_profile(
    user_id: uuid.UUID,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Retrieves a user's profile, including their friend count, event count,
    and a list of the latest 12 events they have attended.
    """
    try:
        # Query 1: Get basic user info (username, pfp, description)
        user_info_query = "SELECT username, pfp, description FROM users WHERE user_id = $1"
        user_info = await db.fetchrow(user_info_query, user_id)
        
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found.")

        # Query 2: Get the count of accepted friendships
        friend_count_query = """
            SELECT COUNT(*) FROM friendships
            WHERE (user_one_id = $1 OR user_two_id = $1) AND status = 'accepted';
        """
        friend_count = await db.fetchval(friend_count_query, user_id)

        # Query 3: Get the total count of events attended
        event_count_query = 'SELECT COUNT(*) FROM "eventMembers" WHERE user_id = $1'
        event_count = await db.fetchval(event_count_query, user_id)

        # Query 4: Get the latest 12 events the user is a member of
        latest_events_query = """
            SELECT
                e.event_id,
                e.name,
                e.description,
                e."dateTime"
            FROM
                events e
            JOIN
                "eventMembers" em ON e.event_id = em.event_id
            WHERE
                em.user_id = $1
            ORDER BY
                e."dateTime" DESC
            LIMIT 12;
        """
        latest_event_rows = await db.fetch(latest_events_query, user_id)

        # Manually construct the list of EventPreview objects
        latest_events = [
            EventPreview(
                event_id=row['event_id'],
                name=row['name'],
                description=row['description'],
                dateTime=row['dateTime']
            )
            for row in latest_event_rows
        ]

        # Assemble the final UserProfile object
        user_profile = UserProfile(
            user_id=user_id,
            username=user_info['username'],
            pfp=user_info['pfp'],
            description=user_info['description'],
            friend_count=friend_count,
            event_count=event_count,
            latest_events=latest_events
        )

        return user_profile

    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
    
# Add this new endpoint to your main.py file

@app.post("/events/{event_id}/pictures", response_model=EventPictureResponse, status_code=201)
async def add_picture_to_event(
    event_id: uuid.UUID,
    picture_data: EventPictureCreate,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Adds a picture to a specific event's gallery.
    Includes a security check to ensure the uploader is a member of the event.
    """
    uploader_id = picture_data.uploader_id

    try:
        # --- Security Check ---
        # Before inserting, verify the uploader is a member of the event.
        # This prevents random users from adding pictures to events they didn't attend.
        is_member_query = 'SELECT 1 FROM "eventMembers" WHERE event_id = $1 AND user_id = $2'
        member_record = await db.fetchrow(is_member_query, event_id, uploader_id)
        
        if not member_record:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: User is not a member of this event and cannot add pictures."
            )

        # --- Insert the Picture Record ---
        # The picture_id and uploaded_at are generated automatically by the database.
        # We use RETURNING * to get the complete new row back in one query.
        insert_query = """
            INSERT INTO event_pictures (event_id, uploader_id, picture_url)
            VALUES ($1, $2, $3)
            RETURNING *;
        """
        
        new_picture_record = await db.fetchrow(
            insert_query,
            event_id,
            uploader_id,
            str(picture_data.picture_url), # Convert HttpUrl object to a string for the DB
        )

        if not new_picture_record:
            raise HTTPException(status_code=500, detail="Failed to save picture information.")

        # Map the database record to our Pydantic response model
        return EventPictureResponse(
            picture_id=new_picture_record['picture_id'],
            event_id=new_picture_record['event_id'],
            uploader_id=new_picture_record['uploader_id'],
            picture_url=new_picture_record['picture_url'],
            uploaded_at=new_picture_record['uploaded_at']
        )
        
    except asyncpg.exceptions.ForeignKeyViolationError:
        # This will trigger if the event_id or uploader_id does not exist in their respective tables.
        raise HTTPException(status_code=404, detail="Event or User not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")