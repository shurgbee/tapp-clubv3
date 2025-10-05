# main.py
import os
import uuid
from datetime import datetime, timezone
from collections import defaultdict
from typing import List, Optional
from contextlib import asynccontextmanager
from enum import Enum
import vertexai
from vertexai.preview.generative_models import GenerativeModel
# --- Library Imports ---
import asyncpg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, HttpUrl, Field


# --- Configuration ---
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
GOOGLE_PROJECT_ID = "neural-tome-474200-v9" # Your Google Cloud Project ID
GOOGLE_LOCATION = "us-central1"     # Your Vertex AI Location

# --- Global DB Pool ---
DB_POOL = None

# --- Lifespan Manager for Startup/Shutdown ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup and shutdown events."""
    global DB_POOL
    print("Application startup: Attempting to create database connection pool...")
    try:
        DB_POOL = await asyncpg.create_pool(dsn=DATABASE_URL, min_size=1, max_size=10)
        print("Database connection pool created successfully.")
        
        yield # Application is now running
    finally:
        if DB_POOL:
            print("Application shutdown: Closing database connection pool.")
            await DB_POOL.close()

# --- FastAPI App Initialization ---
app = FastAPI(
    title="TAPP Club API",
    description="API for a social event and group chat application.",
    lifespan=lifespan
)

# --- Database Dependency ---
async def get_db_connection() -> asyncpg.Connection:
    """Dependency to get a connection from the pool for an endpoint."""
    if not DB_POOL:
        raise HTTPException(status_code=503, detail="Database connection pool is not available.")
    async with DB_POOL.acquire() as connection:
        yield connection


# ==================================================================
# --- FIX 1: RE-ADDED THE MISSING get_db_connection FUNCTION ---
# This function must be defined before the API endpoints that use it.
# ==================================================================
async def get_db_connection() -> asyncpg.Connection:
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



# Add these new models to your main.py file

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

# Add these new Pydantic models to your main.py file

class UserUpdateRequest(BaseModel):
    # All fields are optional. The user can send one, some, or all of them.
    username: Optional[str] = None
    location: Optional[str] = None
    calendar_json_id: Optional[uuid.UUID] = None
    pfp: Optional[uuid.UUID] = None
    description: Optional[str] = None

class UserUpdateResponse(BaseModel):
    # This model represents the full user object returned after a successful update.
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

# Replace the existing get_user_profile function in main.py with this one

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

        # ==================================================================
        # --- UPDATED QUERY 4: Fetches latest events AND their first picture ---
        # ==================================================================
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

        # Manually construct the list of EventPreview objects
        latest_events = [
            EventPreview(
                event_id=row['event_id'],
                name=row['name'],
                description=row['description'],
                dateTime=row['dateTime'],
                first_picture_url=row['first_picture_url'] # <-- Map the new field
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
        # Query 1: Get the basic event information.
        event_query = 'SELECT event_id, name, description, "dateTime" FROM events WHERE event_id = $1'
        event_info = await db.fetchrow(event_query, event_id)

        if not event_info:
            raise HTTPException(status_code=404, detail="Event not found.")

        # Query 2: Get all attendees for the event.
        attendees_query = """
            SELECT u.user_id, u.username, u.pfp
            FROM users u
            JOIN "eventMembers" em ON u.user_id = em.user_id
            WHERE em.event_id = $1;
        """
        attendee_rows = await db.fetch(attendees_query, event_id)
        attendees = [EventAttendee(**row) for row in attendee_rows]

        # Query 3: Get all pictures for the event (caption removed).
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
        # The **row syntax will now work correctly because the model and query match.
        pictures = [EventPictureDetail(**row) for row in picture_rows]

        # Assemble the final response object.
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
    
# In main.py, replace your existing create_event function with this one

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
            # Updated INSERT query to include the location column
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
                event_data.location  # <-- Pass the new location parameter
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
                location=event_data.location # <-- Include location in the response
            )

    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(status_code=404, detail="Creator user not found.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")



# --- API Endpoints ---

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
        # Step 1: Check if a user with this auth0_sub already exists.
        find_user_query = "SELECT user_id FROM users WHERE auth0_sub = $1"
        existing_user_id = await db.fetchval(find_user_query, auth_data.auth0_sub)

        # If the user is found, return their existing UUID.
        if existing_user_id:
            return UserAuthResponse(user_id=existing_user_id)
        
        # Step 2: If the user does not exist, create a new one.
        else:
            # The user_id must be generated by the application since the DB
            # schema doesn't have a default for it.
            new_user_id = uuid.uuid4()
            
            # Since 'username' is UNIQUE and NOT NULL, we must provide one.
            # We'll generate a unique, temporary username that the user can
            # update later via a different profile-editing endpoint.
            # Using a slice of the new UUID is a good way to ensure uniqueness.
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

            # Return the newly created user's UUID.
            return UserAuthResponse(user_id=new_user_id)

    except asyncpg.PostgresError as e:
        # This will catch potential unique constraint violations if two requests
        # try to create the same user at the exact same time.
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
    # Use Pydantic's .model_dump() with exclude_unset=True to get a dict
    # of only the fields that the user actually sent.
    update_fields = update_data.model_dump(exclude_unset=True)

    # If the user sent an empty request body, there's nothing to update.
    if not update_fields:
        raise HTTPException(status_code=400, detail="No update data provided.")

    # --- Dynamically build the SQL UPDATE query ---
    set_clauses = []
    params = []
    param_counter = 1

    for key, value in update_fields.items():
        # Using f-strings to build the query structure, but passing the
        # actual values as parameters to prevent SQL injection.
        set_clauses.append(f'"{key}" = ${param_counter}')
        params.append(value)
        param_counter += 1

    # Join the individual SET clauses with a comma
    set_clause_str = ", ".join(set_clauses)
    
    # Final parameter will be the user_id for the WHERE clause
    params.append(user_id)
    
    # Construct the final query
    # The RETURNING * clause is crucial; it returns the entire updated row.
    query = f"""
        UPDATE users
        SET {set_clause_str}
        WHERE user_id = ${param_counter}
        RETURNING *;
    """

    try:
        updated_user_record = await db.fetchrow(query, *params)

        if not updated_user_record:
            # This means the user_id in the URL did not match any user.
            raise HTTPException(status_code=404, detail="User not found.")

        # If the update was successful, return the updated user data.
        return UserUpdateResponse(**updated_user_record)

    except asyncpg.exceptions.UniqueViolationError:
        # This will trigger if the user tries to change their username to one
        # that is already taken by another user.
        raise HTTPException(status_code=409, detail="Username is already taken.")
    except asyncpg.PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")

# No changes are needed to this function's logic, but here it is for clarity.
# The `location` field from the updated EventUpdateRequest model will be handled automatically.

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