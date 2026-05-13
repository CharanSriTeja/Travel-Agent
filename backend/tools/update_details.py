from langgraph.types import Command
from langchain.messages import HumanMessage,ToolMessage
from langchain.tools import tool,ToolRuntime
@tool
def update_details(origin: str, destination: str, passengers: int, date: str, runtime: ToolRuntime):
    """ To update the source and destination of journey and passengers and date in the state. """
    return Command(
        update = {
            "origin": origin,
            "destination": destination,
            "passengers": passengers,
            "date": date,
            "messages": [
                ToolMessage(
                    content="Trip details updated successfully.",
                    tool_call_id = runtime.tool_call_id)
            ]
        }
    )