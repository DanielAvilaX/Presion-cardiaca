import { supabase } from "../config/supabase.js";

export const profileRepository = {
  async getProfileByUserId(userId) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async upsertProfile(profile) {
    const { error } = await supabase.from("user_profiles").upsert(profile);
    if (error) throw error;
  }
};
