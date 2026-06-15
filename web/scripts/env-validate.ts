// env-validate.ts - Validate required environment variables at build time
// Run: npx tsx scripts/env-validate.ts

const requiredVars: Record<string, string[]> = {
  production: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'STRIPE_SECRET_KEY',
  ],
  development: [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
  ]
};

function validate() {
  const env = process.env.NODE_ENV || 'development';
  const vars = requiredVars[env] || requiredVars.development;
  const missing: string[] = [];

  console.log(`\n🔍 Validating environment for ${env}...\n`);

  for (const v of vars) {
    if (!process.env[v]) {
      missing.push(v);
      console.log(`❌ ${v} is missing`);
    } else {
      console.log(`✅ ${v}`);
    }
  }

  if (missing.length > 0) {
    console.log(`\n❌ ${missing.length} required variable(s) missing!`);
    process.exit(1);
  }

  console.log('\n✅ All required environment variables present!\n');
}

validate();
