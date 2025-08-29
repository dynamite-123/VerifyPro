import axios from "axios";

const VOYAGE_API_URL = process.env.VOYAGE_API_URL || "https://api.voyageapp.io/v1/sms/send";
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const VOYAGE_SENDER = process.env.VOYAGE_SENDER;

if (!VOYAGE_API_KEY) {
  throw new Error("Voyage API key is required in environment variables");
}

export async function sendVoyageSMS(to, message) {
  try {
    const response = await axios.post(
      VOYAGE_API_URL,
      {
        to,
        message,
        from: VOYAGE_SENDER
      },
      {
        headers: {
          Authorization: `Bearer ${VOYAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
}
