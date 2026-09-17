import { supabase } from "../config/supabase.js";

export const authRepository = {
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async signUp(credentials, profile) {
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          age: Number(profile.age),
          document_number: profile.document,
          email: credentials.email
        }
      }
    });

    if (error) throw error;
    return data;
  },

  /** Envía el correo con el enlace de recuperación. */
  async sendPasswordReset(email, redirectTo) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  },

  /** Cambia la contraseña del usuario con sesión activa. */
  async updatePassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};
