from langchain.tools import tool,ToolRuntime
from langgraph.types import Command
import requests
from dotenv import load_dotenv
load_dotenv()

import os

@tool
def search_flight(runtime: ToolRuntime):
    """search the flight between source and destination"""
    
    RAPID_API_KEY = os.getenv("RAPID_API_KEY")
    
    headers = {
        'x-rapidapi-key': RAPID_API_KEY,
        'x-rapidapi-host': "sky-scrapper.p.rapidapi.com",
        'Content-Type': "application/json"
    }
    
    params = {
    "originSkyId": runtime.state.get("origin_sky_id"),
    "destinationSkyId": runtime.state.get("destination_sky_id"),
    "originEntityId": runtime.state.get("origin_entity_id"),
    "destinationEntityId": runtime.state.get("destination_entity_id"),
    "adults": runtime.state.get("passengers"),
    "cabinClass": runtime.state.get("class_type"),
    "date": runtime.state.get("date"),
    "sortBy": "best",
    "currency": "INR",
    "market": "en-US",
    "countryCode": "IN",
}    
    res = requests.get(
            "https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlights", 
            headers=headers,
            params = params
        )
    
    return res.json()