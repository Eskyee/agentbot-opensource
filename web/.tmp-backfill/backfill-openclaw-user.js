"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
function getArg(flag) {
    const idx = process.argv.indexOf(flag);
    if (idx === -1)
        return undefined;
    return process.argv[idx + 1];
}
function parseArgs() {
    const email = getArg('--email') || process.env.EMAIL;
    const openclawInstanceId = getArg('--instance') || process.env.OPENCLAW_INSTANCE_ID;
    const openclawUrl = getArg('--url') || process.env.OPENCLAW_URL;
    const dryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
    if (!email)
        throw new Error('Missing --email (or EMAIL env var)');
    if (!openclawInstanceId)
        throw new Error('Missing --instance (or OPENCLAW_INSTANCE_ID env var)');
    if (!openclawUrl)
        throw new Error('Missing --url (or OPENCLAW_URL env var)');
    return { email, openclawInstanceId, openclawUrl, dryRun };
}
async function main() {
    const { email, openclawInstanceId, openclawUrl, dryRun } = parseArgs();
    const prisma = new client_1.PrismaClient();
    try {
        const before = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, role: true, openclawInstanceId: true, openclawUrl: true },
        });
        if (!before) {
            throw new Error(`No User found for email=${email}`);
        }
        if (dryRun) {
            console.log('[dry-run] Would update:', {
                id: before.id,
                email: before.email,
                from: { openclawInstanceId: before.openclawInstanceId, openclawUrl: before.openclawUrl },
                to: { openclawInstanceId, openclawUrl },
            });
            return;
        }
        await prisma.user.update({
            where: { email },
            data: { openclawInstanceId, openclawUrl },
        });
        const after = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, role: true, openclawInstanceId: true, openclawUrl: true },
        });
        console.log('Updated:', after);
    }
    finally {
        await prisma.$disconnect();
    }
}
main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
});
