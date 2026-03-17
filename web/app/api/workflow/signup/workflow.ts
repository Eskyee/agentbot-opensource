import { sleep, getWritable } from "workflow";

export async function handleUserSignup(email: string) {
  "use workflow";

  const writable = getWritable();
  const writer = writable.getWriter();
  await writer.write("🚀 Starting signup for: " + email + "\n");
  writer.releaseLock();

  await sleep("1s");

  const user = { id: "user_" + Date.now(), email };
  
  const w2 = getWritable();
  const w2w = w2.getWriter();
  await w2w.write("✅ User created: " + user.id + "\n");
  w2w.releaseLock();

  return { userId: user.id, status: "success", email };
}
