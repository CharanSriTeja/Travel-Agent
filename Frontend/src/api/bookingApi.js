import { supabase } from "../lib/supabase";

export async function createBooking(flight) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase.from("bookings").insert({
    user_id: user.id,
    airline: flight.airline || "",
    flight_no: flight.flightNo || "",
    from_airport: flight.from || "",
    to_airport: flight.to || "",
    departure_time: flight.departure || "",
    arrival_time: flight.arrival || "",
    duration: flight.duration || "",
    stops: flight.stops || "",
    cabin: flight.cabin || "Economy",
    price: flight.price || "",
    status: "confirmed",
  }).select().maybeSingle();

  if (error) throw error;
  return data;
}
