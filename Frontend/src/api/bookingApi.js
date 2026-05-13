import { bookingApi } from "../lib/api";

export async function createBooking(flight) {
  const result = await bookingApi.create(flight);
  return result;
}
