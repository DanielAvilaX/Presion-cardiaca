import { authRepository } from "../repositories/authRepository.js";
import { profileRepository } from "../repositories/profileRepository.js";
import { validateRegistration } from "../utils/validation.js";

export const authService = {
  async loadCurrentUser(existingSession = null) {
    const session = existingSession ?? (await authRepository.getSession());

    if (!session?.user) {
      return null;
    }

    let profile;

    try {
      profile = await profileRepository.getProfileByUserId(session.user.id);
    } catch (error) {
      const shouldRecoverProfile =
        error.code === "PGRST116" || error.message?.toLowerCase().includes("0 rows");

      if (!shouldRecoverProfile) {
        throw error;
      }

      const metadata = session.user.user_metadata ?? {};

      // Si el perfil no existe pero la sesion sigue viva, se reconstruye desde los metadatos del usuario.
      await profileRepository.upsertProfile({
        id: session.user.id,
        first_name: metadata.first_name ?? "Usuario",
        last_name: metadata.last_name ?? "",
        age: Number(metadata.age ?? 1),
        document_number: metadata.document_number ?? `pendiente-${session.user.id.slice(0, 8)}`,
        email: metadata.email ?? session.user.email
      });

      profile = await profileRepository.getProfileByUserId(session.user.id);
    }

    return {
      session,
      user: session.user,
      profile
    };
  },

  async login(email, password) {
    if (!email.trim() || !password.trim()) {
      throw new Error("Ingresa correo y contrasena.");
    }

    await authRepository.signIn(email, password);
    return this.loadCurrentUser();
  },

  async register(formData) {
    validateRegistration(formData);

    return authRepository.signUp(
      {
        email: formData.email,
        password: formData.password
      },
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        document: formData.document
      }
    );
  },

  async logout() {
    await authRepository.signOut();
  },

  listenAuthChanges(callback) {
    return authRepository.onAuthStateChange(callback);
  }
};
