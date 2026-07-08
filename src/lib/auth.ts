import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canMutate, roleForNewUser } from "@/lib/auth-logic";

/**
 * The signed-in app user, provisioned on first sign-in (first user ever
 * becomes ADMIN, later ones OPS — promote via the User table for now).
 * Throws when unauthenticated; middleware should have redirected already.
 */
export async function requireUser(): Promise<User> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new Error("Not signed in.");
  }

  const existing = await prisma.user.findUnique({ where: { clerkUserId } });
  if (existing) {
    if (!existing.isActive) throw new Error("This account is deactivated.");
    return existing;
  }

  const clerkUser = await currentUser();
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.emailAddresses[0]?.emailAddress ||
    "Unknown";
  const count = await prisma.user.count();
  return prisma.user.create({
    data: { clerkUserId, name, role: roleForNewUser(count) },
  });
}

/** requireUser + Phase 1 write gate (ADMIN/OPS). Mutating actions call this. */
export async function requireWriter(): Promise<User> {
  const user = await requireUser();
  if (!canMutate(user.role)) {
    throw new Error("Your role does not allow changes.");
  }
  return user;
}
