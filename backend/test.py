from google import genai
from google.genai.types import (
    GenerateContentConfig,
    GoogleMaps,
    HttpOptions,
    Tool,
    ToolConfig,
    RetrievalConfig,
    LatLng,
)


# Only run this block for Vertex AI API
client = genai.Client(
    vertexai=True, project='neural-tome-474200-v9', location='us-central1'
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Where can I get the best espresso near me?",
    config=GenerateContentConfig(
        tools=[
            ToolConfig(
                retrieval_config=RetrievalConfig(
                    lat_lng=LatLng(  # Pass coordinates for location-aware grounding
                        latitude=40.7128,
                        longitude=-74.006
                    ),
                    language_code="en_US",  # Optional: localize Maps results
                ),
            )
        ],
    ),
)

print(response.text)
# Example response:
# 'Here are some of the top-rated places to get espresso near you: ...'