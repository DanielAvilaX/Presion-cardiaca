import { authRepository } from "../repositories/authRepository.js";
import { profileRepository } from "../repositories/profileRepository.js";
import { validateRegistration } from "../utils/validation.js";

export const authService = {
  /**
   * Devuelve el perfil del usuario y lo crea si falta.
   *
   * El trigger `on_auth_user_created` normalmente ya lo creó; esto cubre las
   * cuentas anteriores al trigger o los casos en que falló.
   */
  async ensureProfile(user) {
    let profile;

    try {
      profile = await profileRepository.getProfileByUserId(user.id);
    } catch (error) {
      const missingProfile =
        error.code === "PGRST116" || error.message?.toLowerCase().includes("0 rows");

      if (!missingProfile) throw error;

      const metadata = user.user_metadata ?? {};

      await profileRepository.upsertProfile({
        id: user.id,
        first_name: metadata.first_name ?? "Usuario",
        last_name: metadata.last_name ?? "",
        age: Number(metadata.age ?? 1),
        document_number: metadata.document_number ?? `pendiente-${user.id.slice(0, 8)}`,
        email: metadata.email ?? user.email
      });

      profile = await profileRepository.getProfileByUserId(user.id);
    }

    return profile;
  },

  async loadCurrentUser(existingSession = null) {
    const session = existingSession ?? (await authRepository.getSession());
    if (!session?.user) return null;

    const profile = await this.ensureProfile(session.user);
    return { session, user: session.user, profile };
  },

  async login(email, password) {
    if (!email.trim() || !password.trim()) {
      throw new Error("Escribe tu correo y tu contraseña.");
    }

    await authRepository.signIn(email.trim(), password);
    return this.loadCurrentUser();
  },

  async register(formData) {
    validateRegistration(formData);

    const result = await authRepository.signUp(
      { email: formData.email.trim(), password: formData.password },
      {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        age: formData.age,
        document: formData.document.trim()
      }
    );

    if (result.session?.user) {
      await this.ensureProfile(result.session.user);
    }

    return result;
  },

  async requestPasswordReset(email) {
    if (!email?.trim()) {
      throw new Error("Escribe el correo de tu cuenta.");
    }

    // Supabase devuelve al usuario a esta URL con el token de recuperación.
    await authRepository.sendPasswordReset(email.trim(), `${window.location.origin}/index.html`);
  },

  async updatePassword(password, confirmation) {
    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }

    if (password !== confirmation) {
      throw new Error("Las contraseñas no coinciden.");
    }

    await authRepository.updatePassword(password);
  },

  async logout() {
    await authRepository.signOut();
  },

  listenAuthChanges(callback) {
    return authRepository.onAuthStateChange(callback);
  }
};
