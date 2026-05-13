from langchain.tools import tool,ToolRuntime
from langgraph.types import Command
import os
from langchain.messages import HumanMessage,ToolMessage
import requests
from dotenv import load_dotenv
load_dotenv()

@tool
def search_airport( airport_type: str, runtime: ToolRuntime):
    """Search airport and save sky/entity ids into state.

    airport_type:
    - origin
    - destination
    """
    RAPID_API_KEY = os.getenv("RAPID_API_KEY")
    
    headers = {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': "sky-scrapper.p.rapidapi.com",
        'Content-Type': "application/json"
    }
    if airport_type == "origin":
        params={
            "query":runtime.state.get("origin_airport"),
            "locale": "en-US"
        }
    else:
        params={
            "query":runtime.state.get("destination_airport"),
            "locale": "en-US"
        }

    res = requests.get(
            "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport", 
            headers=headers,
            params = params
    )
    data = res.json()

    # API failed
    if not data.get("status"):
        return Command(
            update={
                "messages": [
                    ToolMessage(
                        content=f"Airport search failed: {data.get('message')}",
                        tool_call_id=runtime.tool_call_id
                    )
                ]
            }
        )

    # No airport found
     # Missing airport data
    if "data" not in data or not data["data"]:

            return Command(
                update={
                    "messages": [
                        ToolMessage(
                            content=f"No airport found for.",
                            tool_call_id=runtime.tool_call_id
                        )
                    ]
                }
        )
            
    airport = data["data"][0]

    if airport_type == "origin":

        return Command(
            update={
                "origin_airport":
                    airport["presentation"]["title"],

                "origin_sky_id":
                    airport["navigation"]["relevantFlightParams"]["skyId"],

                "origin_entity_id":
                    airport["navigation"]["entityId"],
                "messages": [
                    ToolMessage(
                        content="origin airport ids saved.",
                        tool_call_id = runtime.tool_call_id)
                ]
            }
        )

    return Command(
        update={
            "destination_airport":
                airport["presentation"]["title"],

            "destination_sky_id":
                airport["navigation"]["relevantFlightParams"]["skyId"],

            "destination_entity_id":
                airport["navigation"]["entityId"],
            "messages": [
                    ToolMessage(
                        content="destination airport ids saved.",
                        tool_call_id = runtime.tool_call_id)
                ]
        }
    )