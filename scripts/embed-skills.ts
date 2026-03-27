#!/usr/bin/env npx tsx
/**
 * Embed Skills Script
 *
 * Generates OpenAI embeddings for all skills and stores them in the database.
 * Requires:
 *   - pgvector extension enabled on PostgreSQL
 *   - `embedding` column added to the Skill table
 *   - OPENAI_API_KEY environment variable
 *
 * Usage:
 *   OPENAI_API_KEY=sk-... npx tsx scripts/embed-skills.ts [--batch-size 50] [--dry-run]
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmbedResult {
  total: number;
  embedded: number;
  failed: number;
  skipped: number;
}

async function embedSkills(batchSize: number, dryRun: boolean): Promise<EmbedResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');

  // Find skills without embeddings
  const skills = await prisma.$queryRaw<
    Array<{ id: string; name: string; description: string; category: string }>
  >`
    SELECT id, name, COALESCE(description, '') as description, COALESCE(category, '') as category
    FROM "Skill"
    WHERE embedding IS NULL
    LIMIT ${batchSize}
  `;

  const result: EmbedResult = {
    total: skills.length,
    embedded: 0,
    failed: 0,
    skipped: 0,
  };

  if (dryRun) {
    console.log(`[DRY RUN] Would embed ${skills.length} skills`);
    return { ...result, skipped: skills.length };
  }

  for (const skill of skills) {
    try {
      const text = `${skill.name} ${skill.description} ${skill.category}`.trim();

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.substring(0, 8000),
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: { data: { embedding: number[] }[] } = await response.json();
      const embedding = data.data[0].embedding;

      await prisma.$executeRaw`
        UPDATE "Skill" SET embedding = ${`[${embedding.join(',')}]`}::vector
        WHERE id = ${skill.id}
      `;

      result.embedded++;
      console.log(`  [${result.embedded}/${result.total}] Embedded: ${skill.name}`);
    } catch (err) {
      result.failed++;
      console.error(`  [FAIL] ${skill.name}:`, err instanceof Error ? err.message : err);
    }

    // Rate limit: 100ms between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchIdx = args.indexOf('--batch-size');
  const batchSize = batchIdx !== -1 ? parseInt(args[batchIdx + 1]) || 50 : 50;

  console.log(`\n=== Skill Embedding Script ===`);
  console.log(`Batch size: ${batchSize}`);
  console.log(`Dry run: ${dryRun}\n`);

  // Check if pgvector is available
  try {
    await prisma.$queryRaw`SELECT 1::vector`;
  } catch {
    console.error('ERROR: pgvector extension not available. Run:');
    console.error('  CREATE EXTENSION IF NOT EXISTS vector;');
    process.exit(1);
  }

  const result = await embedSkills(batchSize, dryRun);

  console.log(`\n=== Results ===`);
  console.log(`Total:   ${result.total}`);
  console.log(`Embedded: ${result.embedded}`);
  console.log(`Failed:  ${result.failed}`);
  console.log(`Skipped: ${result.skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
