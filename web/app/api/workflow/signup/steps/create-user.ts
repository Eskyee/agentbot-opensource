"use step"

import { prisma } from "@/app/lib/prisma";

interface CreateUserInput {
  email: string;
}

export async function createUser({ email }: CreateUserInput) {
  const name = email.split("@")[0];
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      role: "user",
      plan: "free",
      subscriptionStatus: "inactive",
    },
  });

  return user;
}
