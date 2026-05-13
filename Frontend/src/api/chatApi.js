import axios from "axios";

export const sendMessage = async (message,threadId) => {

  const response = await axios.post(
    "http://localhost:8000/chat",
    {
      message: message,
      thread_id: threadId
    }
  );

  return response.data;
};