import { supabase } from "./supabase";

export async function signInWithOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function grantSelfAdmin() {
  const { error } = await supabase.rpc("grant_self_admin");
  if (error) throw error;
}

