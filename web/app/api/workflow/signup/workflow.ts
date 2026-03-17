import { sleep, getWritable } from "workflow";

export async function handleUserSignup(email: string) {
  "use workflow";

  const writable = getWritable();
  const writer = writable.getWriter();
  await writer.write("🚀 Starting for: " + email + "\n");
  writer.releaseLock();

  await sleep("2s");

  return { userId: "user_" + Date.now(), email, status: "ok" };
}
