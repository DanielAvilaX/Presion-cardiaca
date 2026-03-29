import { supabase } from "../config/supabase.js";

export const recordRepository = {
  async getRecordsByUserId(userId) {
    const { data, error } = await supabase
      .from("pressure_records")
      .select("*")
      .eq("user_id", userId)
      .order("record_date", { ascending: false })
      .order("record_time", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async createRecord(record) {
    const { error } = await supabase.from("pressure_records").insert(record);
    if (error) throw error;
  },

  async updateRecord(id, updates) {
    const { error } = await supabase
      .from("pressure_records")
      .update(updates)
      .eq("id", id);
    if (error) throw error;
  },

  async deleteRecord(id) {
    const { error } = await supabase
      .from("pressure_records")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
};
