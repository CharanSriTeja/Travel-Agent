from langchain.agents import AgentState

class CustomAgentState(AgentState):
    # User request
    origin: str
    destination: str
    date: str
    passengers: int
    budget: int
    origin_latitude: float 
    origin_longitude: float 
    destination_latitude: float 
    destination_longitude: float 

    # Preferences
    class_type: str

    # Tool outputs
    train_results: list
    selected_train: str
    fare: int

    origin_airport: str
    destination_airport: str
    origin_sky_id: str
    destination_sky_id: str
    origin_entity_id: str
    destination_entity_id: str