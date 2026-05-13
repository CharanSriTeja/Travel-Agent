from fastapi import APIRouter
from pydantic import BaseModel

from agents.flight_agent import flight_agent

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    thread_id: str


@router.post("/chat")
async def chat(request: ChatRequest):

    config = {
        "configurable": {
            "thread_id": request.thread_id
        }
    }

    response = flight_agent.invoke(
        {
            "messages": [
                {
                    "role": "user",
                    "content": request.message
                }
            ]
        },
        config=config
    )

    last_message = response["messages"][-1]

    content = last_message.content

    text = ""

    if isinstance(content, list):

        for item in content:

            if isinstance(item, dict):

                if item.get("type") == "text":
                    text += item.get("text", "")

    else:
        text = str(content)

    return {
        "response": text
    }