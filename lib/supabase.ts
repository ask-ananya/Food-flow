import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pxuhseuevmelbdcvzrph.supabase.co"; //process.env.SUPABASE_URL as string;
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4dWhzZXVldm1lbGJkY3Z6cnBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzMzNzUsImV4cCI6MjA1NjUwOTM3NX0.XwXYzHDkICmfVB-baNjlnJrP9_atnKaD8LgY6zdaFxk"; //process.env.SUPABASE_ANON_KEY as string;

//@ts-ignore
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
