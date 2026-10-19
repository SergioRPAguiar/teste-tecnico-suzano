export function authConfig() {
  const { JWT_SECRET: secret, ADMIN_USERNAME: username, ADMIN_PASSWORD: password } = process.env;
  if (!secret || secret.length < 32 || !username || !password) {
    throw new Error("Configure JWT_SECRET (mínimo 32 caracteres), ADMIN_USERNAME e ADMIN_PASSWORD.");
  }
  return { secret, username, password };
}
