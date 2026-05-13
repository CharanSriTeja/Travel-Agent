from langchain.tools import tool,ToolRuntime
import os
from langchain.messages import HumanMessage,ToolMessage
from langgraph.types import Command
import requests
from dotenv import load_dotenv

load_dotenv()
@tool
def get_nearby_airport(airport_type: str, runtime: ToolRuntime):
    """Get the origin and destination airports by giving the destination and origin - lattitude and longitude"""
    
    RAPID_API_KEY = os.getenv("RAPID_API_KEY")
    
    
    headers = {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': "sky-scrapper.p.rapidapi.com",
        'Content-Type': "application/json"
    }
    if airport_type == "origin":
        params = {
        "lat": runtime.state.get("origin_latitude"),
        "lng": runtime.state.get("origin_longitude"),
        "locale": "en-US"
        }
    else:
        params = {
        "lat": runtime.state.get("destination_latitude"),
        "lng": runtime.state.get("destination_longitude"),
        "locale": "en-US"
        }
    
    res = requests.get(
            "https://sky-scrapper.p.rapidapi.com/api/v1/flights/getNearByAirports", 
            headers=headers,
            params = params
    )
    
    data = res.json()
    
    if not data.get("status"):
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Nearby airport lookup failed: {data.get('message')}",
                        tool_call_id=runtime.tool_call_id
                    )
                ]
            }
    )

    if "data" not in data:
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content="No nearby airport data found.",
                        tool_call_id=runtime.tool_call_id
                    )
                ]
            }
        )

    print(data)
    airport = data["data"]["current"] 
    # adjust based on API response
    
    if airport_type == "origin":
        return Command(
            update={
                "origin_airport": airport["presentation"]["title"],
                "messages": [
                    ToolMessage(
                        content="origin airport saved.",
                        tool_call_id = runtime.tool_call_id)
                ]
            }
        )
    return Command(
            update={
                "destination_airport": airport["presentation"]["title"],
                "messages": [
                    ToolMessage(
                        content="destination airport saved.",
                        tool_call_id = runtime.tool_call_id)
                ]
            }
    )