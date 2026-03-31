import { authRepository } from "../repositories/authRepository.js";
import { profileRepository } from "../repositories/profileRepository.js";
import { validateRegistration } from "../utils/validation.js";

export const authService = {
  async ensureProfile(user) {
    let profile;

    try {
      profile = await profileRepository.getProfileByUserId(user.id);
    } catch (error) {
      const shouldRecoverProfile =
        error.code === "PGRST116" || error.message?.toLowerCase().includes("0 rows");

      if (!shouldRecoverProfile) {
        throw error;
      }

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

    if (!session?.user) {
      return null;
    }

    const profile = await this.ensureProfile(session.user);

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

    const result = await authRepository.signUp(
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

    if (result.session?.user) {
      await this.ensureProfile(result.session.user);
    }

    return result;
  },

  async logout() {
    await authRepository.signOut();
  },

  listenAuthChanges(callback) {
    return authRepository.onAuthStateChange(callback);
  }
};
