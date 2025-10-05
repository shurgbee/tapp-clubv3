
import os
import uuid
import json
import requests
from datetime import datetime, timezone
from collections import defaultdict
from typing import List, Optional
from contextlib import asynccontextmanager
from enum import Enum
import vertexai
from vertexai.preview.generative_models import GenerativeModel

import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, Field
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



load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
 

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

DB_POOL = None

from typing import AsyncGenerator

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup and shutdown events."""
    global DB_POOL
    print("Application startup: Attempting to create database connection pool...")
    try:
        DB_POOL = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=10)
        print("Database connection pool created successfully.")
        yield
    except Exception as e:
        print(f"Error creating database connection pool: {e}")
        yield
    finally:
        if DB_POOL:
            print("Application shutdown: Closing database connection pool.")
            await DB_POOL.close()

app = FastAPI(
    title="TAPP Club API",
    description="API for a social event and group chat application.",
    lifespan=lifespan
)

# Configure CORS for frontend access
origins = [
    "http://localhost:8081",  # Local Expo
    "http://localhost:19006",  # Local Expo web
    "*",  # Allow all origins (update for production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_db_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Dependency to get a connection from the pool."""
    if not DB_POOL:
        raise HTTPException(status_code=503, detail="Database connection pool is not available.")
    
    async with DB_POOL.acquire() as connection:
        yield connection







class ChatMessage(BaseModel):
    poster_id: uuid.UUID
    poster_name: str
    messageType: str
    messageContent: str
    dateTime: datetime

    class Config:
        from_attributes = True 

class GroupChat(BaseModel):
    group_id: uuid.UUID
    group_name: str
    messages: List[ChatMessage]

    class Config:
        from_attributes = True 


class SendMessageRequest(BaseModel):
    user_id: uuid.UUID
    messageType: str
    messageContent: str


class FriendRequestCreate(BaseModel):
    requester_id: uuid.UUID  
    addressee_id: uuid.UUID  

    
from enum import Enum

class FriendRequestAction(str, Enum):
    ACCEPT = "accepted"
    DECLINE = "declined"

class FriendRequestUpdate(BaseModel):
    
    responder_id: uuid.UUID
    
    action: FriendRequestAction




class AddEventMembersRequest(BaseModel):
    user_ids: List[uuid.UUID]

class AddEventMembersResponse(BaseModel):
    message: str
    added_count: int

class EventPreview(BaseModel):
    event_id: uuid.UUID
    name: str
    description: str
    location: str
    dateTime: datetime
    first_picture_url: Optional[str] = None
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
    picture_url: HttpUrl  

class EventPictureResponse(BaseModel):
    picture_id: uuid.UUID
    event_id: uuid.UUID
    uploader_id: uuid.UUID
    picture_url: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class User(BaseModel):
    user_id: uuid.UUID
    username: str
    pfp: Optional[uuid.UUID]
    description: Optional[str]
    sub: str

    class Config:
        from_attributes = True

# --- API Endpoints ---
# In your main.py file, replace the get_user_groups function with this one:




class EventAttendee(BaseModel):
    user_id: uuid.UUID
    username: str
    pfp: Optional[uuid.UUID]

class EventPictureDetail(BaseModel):
    picture_id: uuid.UUID
    picture_url: str
    uploader_id: uuid.UUID
    uploader_name: str
    uploaded_at: datetime

class EventDetail(BaseModel):
    event_id: uuid.UUID
    name: str
    description: str
    location: str
    dateTime: datetime
    attendees: List[EventAttendee]
    pictures: List[EventPictureDetail]

class EventCreate(BaseModel):
    creator_id: uuid.UUID
    name: str
    description: str
    dateTime: datetime
    location: str

class EventCreateResponse(BaseModel):
    event_id: uuid.UUID
    name: str
    description: str
    dateTime: datetime
    location: str

class UserAuthRequest(BaseModel):
    auth0_sub: str = Field(..., description="The unique subject claim from the Auth0 token.")

class UserAuthResponse(BaseModel):
    user_id: uuid.UUID



class UserUpdateRequest(BaseModel):
    
    username: Optional[str] = None
    location: Optional[str] = None
    calendar_json_id: Optional[uuid.UUID] = None
    pfp: Optional[uuid.UUID] = None
    description: Optional[str] = None

class UserUpdateResponse(BaseModel):
    
    user_id: uuid.UUID
    username: str
    location: Optional[str]
    calendar_json_id: Optional[uuid.UUID]
    pfp: Optional[uuid.UUID]
    description: Optional[str]
    auth0_sub: str

class EventUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    dateTime: Optional[datetime] = None
    location: Optional[str] = None 



class GroupCreateRequest(BaseModel):
    creator_id: uuid.UUID
    name: str
    
    pfp: Optional[HttpUrl] = None
    initial_member_ids: List[uuid.UUID]

class GroupCreateResponse(BaseModel):
    group_id: uuid.UUID
    name: str
    
    pfp: Optional[str] = None

class GroupPreview(BaseModel):
    group_id: uuid.UUID
    group_name: str
    
    pfp: Optional[str] = None
    last_message_content: Optional[str]
    last_message_timestamp: Optional[datetime]
    last_message_poster_name: Optional[str]

    

class AddMembersRequest(BaseModel):
    user_ids: List[uuid.UUID]

class AddMembersResponse(BaseModel):
    message: str
    added_count: int



class PostCreateRequest(BaseModel):
    event_id: uuid.UUID
    poster_id: uuid.UUID
    title: str
    description: Optional[str] = None

class PostResponse(BaseModel):
    post_id: uuid.UUID
    event_id: uuid.UUID
    poster_id: uuid.UUID
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime



class PostPictureDetail(BaseModel):
    picture_id: uuid.UUID
    picture_url: str
    uploaded_at: datetime

class PosterInfo(BaseModel):
    user_id: uuid.UUID
    username: str
    pfp: Optional[uuid.UUID]

class PostDetailResponse(BaseModel):
    post_id: uuid.UUID
    title: str
    description: Optional[str]
    created_at: datetime
    poster: PosterInfo
    pictures: List[PostPictureDetail]



class PostPictureCreate(BaseModel):
    uploader_id: uuid.UUID
    picture_url: HttpUrl

class PostPictureResponse(BaseModel):
    picture_id: uuid.UUID
    post_id: uuid.UUID
    picture_url: str
    uploaded_at: datetime

# Add these new Pydantic models to your main.py file

class UserTapRequest(BaseModel):
    # The user initiating the tap
    tapper_id: uuid.UUID
    # The user being tapped
    tapped_id: uuid.UUID

class UserTapResponse(BaseModel):
    status: str
    message: str

# Health check endpoint for Docker and load balancers
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "service": "TAPP Club API",
        "version": "1.0.0"
    }

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "TAPP Club API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

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
        
        
        
        
        
        response = []
        for row in rows:
            
            
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
    
    
    current_timestamp = datetime.now(timezone.utc)

    query = """
        INSERT INTO conversations (group_id, user_id, "messageType", "messageContent", "dateTime")
        VALUES ($1, $2, $3, $4, $5)
        RETURNING user_id AS poster_id, "messageType", "messageContent", "dateTime";
    """
    
    try:
        
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

        
        user_query = "SELECT username FROM users WHERE user_id = $1"
        user_record = await db.fetchrow(user_query, inserted_row['poster_id'])
        poster_name = user_record['username'] if user_record else "Unknown User"

        
        response_message = ChatMessage(
            poster_id=inserted_row['poster_id'],
            poster_name=poster_name,
            messageType=inserted_row['messageType'],
            messageContent=inserted_row['messageContent'],
            dateTime=inserted_row['dateTime']
        )
        
        return response_message

    except asyncpg.exceptions.ForeignKeyViolationError:
        
        raise HTTPException(status_code=404, detail="Group or User not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")

@app.get("/users/by-sub/{sub}", response_model=User)
async def get_user_by_sub(
    sub: str,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Retrieves a user's information by their Auth0 sub (subject ID).
    The sub is a unique identifier from Auth0 for each user.
    """
    query = "SELECT user_id, username, pfp, description, auth0_sub FROM users WHERE auth0_sub = $1"
    
    try:
        user_row = await db.fetchrow(query, sub)
        
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found with the provided sub.")
        
        # Construct the User model from the database row
        user = User(
            user_id=user_row['user_id'],
            username=user_row['username'],
            pfp=user_row['pfp'],
            description=user_row['description'],
            sub=user_row['auth0_sub']
        )
        
        return user
        
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")



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

    
    if requester_id == addressee_id:
        raise HTTPException(status_code=400, detail="Cannot send a friend request to yourself.")

    
    user_one_id = min(requester_id, addressee_id)
    user_two_id = max(requester_id, addressee_id)
    
    query = """
        INSERT INTO friendships (user_one_id, user_two_id, status, action_user_id)
        VALUES ($1, $2, 'pending', $3)
        ON CONFLICT (user_one_id, user_two_id) DO NOTHING;
    """
    
    try:
        
        result = await db.execute(query, user_one_id, user_two_id, requester_id)
        if "INSERT 0" in result:
             
            raise HTTPException(status_code=409, detail="A friendship or request already exists between these users.")
            
        return {"message": "Friend request sent successfully."}

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="One or both users not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    

    

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
    new_status = update.action.value 

    
    user_one_id = min(requester_id, responder_id)
    user_two_id = max(requester_id, responder_id)
    
    
    
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
            
            raise HTTPException(status_code=404, detail="No pending friend request found to update.")

        action_word = "accepted" if new_status == "accepted" else "declined"
        return {"message": f"Friend request successfully {action_word}."}

    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    


    



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
    and a list of the latest 12 events they have attended, including the
    first picture of each event.
    """
    try:
        
        user_info_query = "SELECT username, pfp, description FROM users WHERE user_id = $1"
        user_info = await db.fetchrow(user_info_query, user_id)
        
        if not user_info:
            raise HTTPException(status_code=404, detail="User not found.")

        
        friend_count_query = """
            SELECT COUNT(*) FROM friendships
            WHERE (user_one_id = $1 OR user_two_id = $1) AND status = 'accepted';
        """
        friend_count = await db.fetchval(friend_count_query, user_id)

        
        event_count_query = 'SELECT COUNT(*) FROM "eventMembers" WHERE user_id = $1'
        event_count = await db.fetchval(event_count_query, user_id)

        
        
        
        latest_events_query = """
            WITH first_pictures AS (
                -- This CTE finds the "first" picture for each event.
                -- "First" is defined by the lowest display_order, then the earliest upload time.
                SELECT DISTINCT ON (event_id)
                    event_id,
                    picture_url
                FROM event_pictures
                ORDER BY event_id, display_order ASC, uploaded_at ASC
            )
            SELECT
                e.event_id,
                e.name,
                e.description,
                e."dateTime",
                fp.picture_url AS first_picture_url -- Get the URL from our CTE
            FROM
                events e
            JOIN
                "eventMembers" em ON e.event_id = em.event_id
            LEFT JOIN -- Use LEFT JOIN so events with no pictures are still included
                first_pictures fp ON e.event_id = fp.event_id
            WHERE
                em.user_id = $1
            ORDER BY
                e."dateTime" DESC
            LIMIT 12;
        """
        latest_event_rows = await db.fetch(latest_events_query, user_id)

        
        latest_events = [
            EventPreview(
                event_id=row['event_id'],
                name=row['name'],
                description=row['description'],
                dateTime=row['dateTime'],
                first_picture_url=row['first_picture_url'] 
            )
            for row in latest_event_rows
        ]

        
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
        
        
        
        is_member_query = 'SELECT 1 FROM "eventMembers" WHERE event_id = $1 AND user_id = $2'
        member_record = await db.fetchrow(is_member_query, event_id, uploader_id)
        
        if not member_record:
            raise HTTPException(
                status_code=403,
                detail="Forbidden: User is not a member of this event and cannot add pictures."
            )

        
        
        
        insert_query = """
            INSERT INTO event_pictures (event_id, uploader_id, picture_url)
            VALUES ($1, $2, $3)
            RETURNING *;
        """
        
        new_picture_record = await db.fetchrow(
            insert_query,
            event_id,
            uploader_id,
            str(picture_data.picture_url), 
        )

        if not new_picture_record:
            raise HTTPException(status_code=500, detail="Failed to save picture information.")

        
        return EventPictureResponse(
            picture_id=new_picture_record['picture_id'],
            event_id=new_picture_record['event_id'],
            uploader_id=new_picture_record['uploader_id'],
            picture_url=new_picture_record['picture_url'],
            uploaded_at=new_picture_record['uploaded_at']
        )
        
    except asyncpg.exceptions.ForeignKeyViolationError:
        
        raise HTTPException(status_code=404, detail="Event or User not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    
@app.get("/events/{event_id}", response_model=EventDetail)
async def get_event_details(
    event_id: uuid.UUID,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Retrieves the full details for a single event, including the name,
    description, date, a list of attendees, and all associated pictures.
    """
    try:
        
        event_query = 'SELECT event_id, name, description, "dateTime" FROM events WHERE event_id = $1'
        event_info = await db.fetchrow(event_query, event_id)

        if not event_info:
            raise HTTPException(status_code=404, detail="Event not found.")

        
        attendees_query = """
            SELECT u.user_id, u.username, u.pfp
            FROM users u
            JOIN "eventMembers" em ON u.user_id = em.user_id
            WHERE em.event_id = $1;
        """
        attendee_rows = await db.fetch(attendees_query, event_id)
        attendees = [EventAttendee(**row) for row in attendee_rows]

        
        pictures_query = """
            SELECT
                p.picture_id,
                p.picture_url,
                p.uploader_id,
                u.username AS uploader_name,
                p.uploaded_at
            FROM event_pictures p
            JOIN users u ON p.uploader_id = u.user_id
            WHERE p.event_id = $1
            ORDER BY p.display_order ASC, p.uploaded_at ASC;
        """
        picture_rows = await db.fetch(pictures_query, event_id)
        
        pictures = [EventPictureDetail(**row) for row in picture_rows]

        
        return EventDetail(
            event_id=event_info['event_id'],
            name=event_info['name'],
            description=event_info['description'],
            dateTime=event_info['dateTime'],
            attendees=attendees,
            pictures=pictures
        )

    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")
    


@app.post("/events", response_model=EventCreateResponse, status_code=201)
async def create_event(
    event_data: EventCreate,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Creates a new event, including its location, and automatically
    adds the creator as the first member.
    """
    try:
        async with db.transaction():
            
            insert_event_query = """
                INSERT INTO events (name, description, "dateTime", location)
                VALUES ($1, $2, $3, $4)
                RETURNING event_id;
            """
            new_event_id = await db.fetchval(
                insert_event_query,
                event_data.name,
                event_data.description,
                event_data.dateTime,
                event_data.location  
            )

            if not new_event_id:
                raise HTTPException(status_code=500, detail="Failed to create the event.")

            add_creator_query = """
                INSERT INTO "eventMembers" (event_id, user_id)
                VALUES ($1, $2);
            """
            await db.execute(add_creator_query, new_event_id, event_data.creator_id)

            return EventCreateResponse(
                event_id=new_event_id,
                name=event_data.name,
                description=event_data.description,
                dateTime=event_data.dateTime,
                location=event_data.location 
            )

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="Creator user not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")





@app.post("/users", response_model=UserAuthResponse, status_code=200)
async def get_or_create_user(
    auth_data: UserAuthRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Finds a user by their Auth0 subject (auth0_sub).
    - If the user exists, it returns their internal user_id.
    - If the user does not exist, it creates a new user record with a
      unique, temporary username and returns the new user_id.
    """
    try:
        
        find_user_query = "SELECT user_id FROM users WHERE auth0_sub = $1"
        existing_user_id = await db.fetchval(find_user_query, auth_data.auth0_sub)

        
        if existing_user_id:
            return UserAuthResponse(user_id=existing_user_id)
        
        
        else:
            
            
            new_user_id = uuid.uuid4()
            
            
            
            
            
            new_username = f"user_{new_user_id.hex[:12]}"

            insert_user_query = """
                INSERT INTO users (user_id, auth0_sub, username)
                VALUES ($1, $2, $3);
            """
            await db.execute(
                insert_user_query,
                new_user_id,
                auth_data.auth0_sub,
                new_username
            )

            
            return UserAuthResponse(user_id=new_user_id)

    except asyncpg.PostgresError as e:
        
        
        raise HTTPException(status_code=500, detail=f"Database error: {e}")


@app.patch("/users/{user_id}", response_model=UserUpdateResponse)
async def edit_user(
    user_id: uuid.UUID,
    update_data: UserUpdateRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Updates a user's profile information.
    Only the fields provided in the request body will be updated.
    """
    
    
    update_fields = update_data.model_dump(exclude_unset=True)

    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No update data provided.")

    
    set_clauses = []
    params = []
    param_counter = 1

    for key, value in update_fields.items():
        
        
        set_clauses.append(f'"{key}" = ${param_counter}')
        params.append(value)
        param_counter += 1

    
    set_clause_str = ", ".join(set_clauses)
    
    
    params.append(user_id)
    
    
    
    query = f"""
        UPDATE users
        SET {set_clause_str}
        WHERE user_id = ${param_counter}
        RETURNING *;
    """

    try:
        updated_user_record = await db.fetchrow(query, *params)

        if not updated_user_record:
            
            raise HTTPException(status_code=404, detail="User not found.")

        
        return UserUpdateResponse(**updated_user_record)

    except asyncpg.exceptions.UniqueViolationError:
        
        
        raise HTTPException(status_code=409, detail="Username is already taken.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")




@app.patch("/events/{event_id}", response_model=EventCreateResponse)
async def edit_event(
    event_id: uuid.UUID,
    update_data: EventUpdateRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Updates an event's details.
    Only the fields provided in the request body will be updated.
    """
    update_fields = update_data.model_dump(exclude_unset=True)

    if not update_fields:
        raise HTTPException(status_code=400, detail="No update data provided.")

    set_clauses = []
    params = []
    param_counter = 1

    for key, value in update_fields.items():
        column_name = f'"{key}"' if key == "dateTime" else key
        set_clauses.append(f'{column_name} = ${param_counter}')
        params.append(value)
        param_counter += 1

    set_clause_str = ", ".join(set_clauses)
    params.append(event_id)
    
    query = f"""
        UPDATE events
        SET {set_clause_str}
        WHERE event_id = ${param_counter}
        RETURNING *;
    """

    try:
        updated_event_record = await db.fetchrow(query, *params)

        if not updated_event_record:
            raise HTTPException(status_code=404, detail="Event not found.")

        return EventCreateResponse(**updated_event_record)

    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    


@app.post("/groups", response_model=GroupCreateResponse, status_code=201)
async def create_group_with_members(
    group_data: GroupCreateRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Creates a new group and adds an initial list of members.
    The group creator is automatically included as a member.
    This is performed in a single database transaction.
    """
    try:
        async with db.transaction():
            
            
            pfp_url_for_db = str(group_data.pfp) if group_data.pfp else None

            
            insert_group_query = """
                INSERT INTO groups (name, pfp)
                VALUES ($1, $2)
                RETURNING group_id;
            """
            new_group_id = await db.fetchval(
                insert_group_query,
                group_data.name,
                pfp_url_for_db  
            )

            if not new_group_id:
                raise HTTPException(status_code=500, detail="Failed to create the group.")

            
            unique_member_ids = set(group_data.initial_member_ids)
            unique_member_ids.add(group_data.creator_id)
            members_to_insert = [(new_group_id, member_id) for member_id in unique_member_ids]

            add_members_query = """
                INSERT INTO "groupMembers" (group_id, user_id)
                VALUES ($1, $2);
            """
            await db.executemany(add_members_query, members_to_insert)

            
            return GroupCreateResponse(
                group_id=new_group_id,
                name=group_data.name,
                pfp=pfp_url_for_db 
            )

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="One or more users to be added were not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    


@app.post("/groups/{group_id}/members", response_model=AddMembersResponse, status_code=200)
async def add_members_to_group(
    group_id: uuid.UUID,
    request: AddMembersRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Adds one or more users to an existing group.
    If a user is already a member, they will be ignored, not duplicated.
    """
    user_ids_to_add = request.user_ids
    
    if not user_ids_to_add:
        raise HTTPException(status_code=400, detail="No user IDs provided to add.")

    
    unique_member_ids = set(user_ids_to_add)
    
    
    members_to_insert = [(group_id, user_id) for user_id in unique_member_ids]

    
    
    query = """
        INSERT INTO "groupMembers" (group_id, user_id)
        SELECT * FROM UNNEST($1::uuid[], $2::uuid[])
        ON CONFLICT (group_id, user_id) DO NOTHING;
    """
    
    
    group_ids_list = [group_id] * len(unique_member_ids)
    user_ids_list = list(unique_member_ids)

    try:
        
        result = await db.execute(
            'INSERT INTO "groupMembers" (group_id, user_id) SELECT $1, unnest($2::uuid[]) ON CONFLICT (group_id, user_id) DO NOTHING',
            group_id,
            user_ids_list
        )
        
        
        
        added_count = int(result.split()[-1])

        return AddMembersResponse(
            message=f"Operation complete. {added_count} new member(s) added to the group.",
            added_count=added_count
        )

    except asyncpg.exceptions.ForeignKeyViolationError:
        
        raise HTTPException(status_code=404, detail="Group or one or more users not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    


@app.post("/posts", response_model=PostResponse, status_code=201)
async def create_post(
    post_data: PostCreateRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """Creates a new post associated with an event."""
    try:
        
        
        is_member_query = 'SELECT 1 FROM "eventMembers" WHERE event_id = $1 AND user_id = $2'
        member_record = await db.fetchrow(is_member_query, post_data.event_id, post_data.poster_id)
        if not member_record:
            raise HTTPException(status_code=403, detail="Forbidden: User is not a member of this event.")

        
        insert_query = """
            INSERT INTO posts (event_id, poster_id, title, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        """
        new_post_record = await db.fetchrow(
            insert_query,
            post_data.event_id,
            post_data.poster_id,
            post_data.title,
            post_data.description
        )
        return PostResponse(**new_post_record)

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="Event or User not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    



@app.get("/posts/{post_id}", response_model=PostDetailResponse)
async def get_post_details(
    post_id: uuid.UUID,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """Retrieves the full details for a single post, including pictures."""
    try:
        
        post_query = """
            SELECT p.*, u.username, u.pfp
            FROM posts p
            JOIN users u ON p.poster_id = u.user_id
            WHERE p.post_id = $1;
        """
        post_info = await db.fetchrow(post_query, post_id)
        if not post_info:
            raise HTTPException(status_code=404, detail="Post not found.")

        
        pictures_query = """
            SELECT picture_id, picture_url, uploaded_at
            FROM post_pictures
            WHERE post_id = $1
            ORDER BY display_order ASC, uploaded_at ASC;
        """
        picture_rows = await db.fetch(pictures_query, post_id)
        pictures = [PostPictureDetail(**row) for row in picture_rows]
        
        
        return PostDetailResponse(
            post_id=post_info['post_id'],
            title=post_info['title'],
            description=post_info['description'],
            created_at=post_info['created_at'],
            poster=PosterInfo(
                user_id=post_info['poster_id'],
                username=post_info['username'],
                pfp=post_info['pfp']
            ),
            pictures=pictures
        )

    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    



@app.post("/posts/{post_id}/pictures", response_model=PostPictureResponse, status_code=201)
async def add_picture_to_post(
    post_id: uuid.UUID,
    picture_data: PostPictureCreate,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """Adds a picture to a specific post's gallery."""
    try:
        async with db.transaction():
            
            post_owner_query = "SELECT poster_id FROM posts WHERE post_id = $1"
            poster_id = await db.fetchval(post_owner_query, post_id)
            
            if poster_id is None:
                raise HTTPException(status_code=404, detail="Post not found.")
            if poster_id != picture_data.uploader_id:
                raise HTTPException(status_code=403, detail="Forbidden: Only the original poster can add pictures.")

            
            insert_query = """
                INSERT INTO post_pictures (post_id, picture_url)
                VALUES ($1, $2)
                RETURNING *;
            """
            new_picture = await db.fetchrow(
                insert_query,
                post_id,
                str(picture_data.picture_url)
            )
            return PostPictureResponse(**new_picture)

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="Post or User not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    


@app.post("/events/{event_id}/members", response_model=AddEventMembersResponse, status_code=200)
async def add_members_to_event(
    event_id: uuid.UUID,
    request: AddEventMembersRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Adds one or more users to an existing event.
    If a user is already a member of the event, they will be ignored.
    """
    user_ids_to_add = request.user_ids
    
    if not user_ids_to_add:
        raise HTTPException(status_code=400, detail="No user IDs provided to add.")

    
    unique_member_ids = set(user_ids_to_add)
    user_ids_list = list(unique_member_ids)

    
    
    
    query = """
        INSERT INTO "eventMembers" (event_id, user_id)
        SELECT $1, unnest($2::uuid[])
        ON CONFLICT (event_id, user_id) DO NOTHING;
    """
    
    try:
        
        result = await db.execute(query, event_id, user_ids_list)
        
        
        
        added_count = int(result.split()[-1])

        return AddEventMembersResponse(
            message=f"Operation complete. {added_count} new member(s) added to the event.",
            added_count=added_count
        )

    except asyncpg.exceptions.ForeignKeyViolationError:
        
        raise HTTPException(status_code=404, detail="Event or one or more users not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    
# Add this new endpoint to your main.py file

# In main.py, replace your existing tap_user_at_event function with this one

@app.post("/events/{event_id}/tap", response_model=UserTapResponse)
async def tap_user_at_event(
    event_id: uuid.UUID,
    request: UserTapRequest,
    db: asyncpg.Connection = Depends(get_db_connection)
):
    """
    Records a mutual 'tap' interaction between two users at an event.
    This sets the 'tapped' boolean to TRUE for BOTH the tapper and the tapped user.
    The operation is idempotent; it will not error if a user is already tapped.
    """
    tapper_id = request.tapper_id
    tapped_id = request.tapped_id

    if tapper_id == tapped_id:
        raise HTTPException(status_code=400, detail="A user cannot tap themselves.")

    try:
        # A transaction ensures all checks and the update happen atomically.
        async with db.transaction():
            # --- Security Check ---
            # Verify that BOTH users are members of the specified event.
            # We expect to find exactly 2 records.
            check_membership_query = """
                SELECT COUNT(*) FROM "eventMembers"
                WHERE event_id = $1 AND user_id = ANY($2::uuid[]);
            """
            member_count = await db.fetchval(
                check_membership_query,
                event_id,
                [tapper_id, tapped_id]
            )

            if member_count != 2:
                raise HTTPException(
                    status_code=403,
                    detail="Forbidden: Both users must be members of the event to interact."
                )

            # --- Update Both Users ---
            # This query updates the 'tapped' status for both users involved
            # in the interaction within the specified event.
            update_tap_query = """
                UPDATE "eventMembers"
                SET tapped = TRUE
                WHERE event_id = $1 AND user_id = ANY($2::uuid[]);
            """
            await db.execute(update_tap_query, event_id, [tapper_id, tapped_id])

            # Since the operation is now mutual, we return a simple success message.
            return UserTapResponse(
                status="tapped",
                message=f"Tap interaction between user {tapper_id} and {tapped_id} has been successfully recorded."
            )

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="Event or one of the users not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")