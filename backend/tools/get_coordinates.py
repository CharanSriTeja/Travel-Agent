from langchain.tools import tool,ToolRuntime
import requests
from langgraph.types import Command
from langchain.messages import HumanMessage,ToolMessage

@tool
def get_coordinates(airport_type: str, runtime: ToolRuntime):
    """Get latitude and longitude of both origin and destination places not airports"""

    url = "https://nominatim.openstreetmap.org/search"
    if(airport_type == "origin"):
        place = runtime.state.get("origin")+", Andhra Pradesh, India"
    else:
        place = runtime.state.get("destination")+", Andhra Pradesh, India"
        
    params = {
        "q": place,
        "format": "json",
        "limit": 1,
        "countrycodes": "in"
    }

    headers = {
        "User-Agent": "flight-agent"
    }

    res = requests.get(url, params=params, headers=headers)

    data = res.json()

    if not data:
        return "Location not found"
    if airport_type =="origin":
        return Command(
            update = {
            "origin_latitude": float(data[0]["lat"]),
            "origin_longitude": float(data[0]["lon"]),
            "messages": [
                ToolMessage(
                    content="origin coordinates updated.",
                    tool_call_id = runtime.tool_call_id)
            ]
        })
    else:
        return Command(
        update = {
            "destination_latitude": float(data[0]["lat"]),
            "destination_longitude": float(data[0]["lon"]),
            "messages": [
                ToolMessage(
                    content="destination coordinates updated.",
                    tool_call_id = runtime.tool_call_id)
            ]
        })