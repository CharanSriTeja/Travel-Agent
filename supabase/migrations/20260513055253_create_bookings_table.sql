/*
  # Create bookings table

  1. New Tables
    - `bookings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `airline` (text)
      - `flight_no` (text)
      - `from_airport` (text)
      - `to_airport` (text)
      - `departure_time` (text)
      - `arrival_time` (text)
      - `duration` (text)
      - `stops` (text)
      - `cabin` (text)
      - `price` (text)
      - `status` (text, default 'confirmed')
      - `booked_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `bookings` table
    - Users can only read and insert their own bookings
*/

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  airline text NOT NULL DEFAULT '',
  flight_no text NOT NULL DEFAULT '',
  from_airport text NOT NULL DEFAULT '',
  to_airport text NOT NULL DEFAULT '',
  departure_time text NOT NULL DEFAULT '',
  arrival_time text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  stops text NOT NULL DEFAULT '',
  cabin text NOT NULL DEFAULT 'Economy',
  price text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'confirmed',
  booked_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
