
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (config: SupabaseConfig) => {
  if (!config.url || !config.key) return false;
  try {
    supabase = createClient(config.url, config.key);
    localStorage.setItem('lifelog_supabase_config', JSON.stringify(config));
    return true;
  } catch (e) {
    console.error("Supabase init failed", e);
    return false;
  }
};

export const getSupabase = () => supabase;

// Login with OTP: STRICTLY LOGIN ONLY. Do not create user.
export const signInWithOtp = async (email: string, shouldCreateUser: boolean = false) => {
  if (!supabase) throw new Error("Supabase not initialized");
  
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: shouldCreateUser // Critical for separating login vs register
    }
  });
  if (error) throw error;
};

// Verify OTP: Can be for 'signup' (registration) or 'magiclink'/'email' (login)
export const verifyOtp = async (email: string, token: string, type: 'signup' | 'email' | 'magiclink' = 'email') => {
  if (!supabase) throw new Error("Supabase not initialized");

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type
  });

  if (error) throw error;
  return data;
};

// Register Step 1: Send confirmation email (with code if configured in Supabase)
export const signUpWithPassword = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    // Ensure we don't auto-login if email confirmation is on (standard Supabase behavior)
  });
  if (error) throw error;
  return data;
};

export const signInWithPassword = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not initialized");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  if (supabase) {
    await supabase.auth.signOut();
  }
};
