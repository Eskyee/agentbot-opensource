// This file shows the Prisma schema additions needed
// Add these models to your prisma/schema.prisma file

model Agent {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name      String
  model     String   @default("claude-opus-4-6")
  status    String   @default("provisioning") // provisioning, running, stopped, error
  
  websocketUrl String
  config    Json     @default("{}")
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  // Relations
  messages  Message[]
  logs      AgentLog[]
  
  @@index([userId])
  @@index([status])
}

model Message {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  role      String   // "user", "assistant", "system"
  content   String   @db.Text
  metadata  Json     @default("{}")
  
  createdAt DateTime @default(now())
  
  @@index([agentId])
}

model AgentLog {
  id        String   @id @default(cuid())
  agentId   String
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  
  level     String   // "info", "warn", "error", "debug"
  message   String   @db.Text
  data      Json     @default("{}")
  
  createdAt DateTime @default(now())
  
  @@index([agentId])
  @@index([level])
}

// Update User model to include agents relationship
// Add this line to your existing User model:
// agents   Agent[]
