// Thin shim so existing server imports (`import { auth } from "@/lib/auth"`)
// keep working without changes after the NextAuth → custom-JWT migration.
export { getSession as auth } from "@/lib/session";
