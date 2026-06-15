#!/usr/bin/env node
/**
 * Weekly Blog Digest — sends latest blog posts to all users
 * Run weekly via cron: 0 9 * * 1 node scripts/weekly-digest.js
 */

import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

const BLOG_URL = 'https://agentbot.sh/blog'
const DISCORD_URL = 'https://discord.gg/n5zvYRnCDF'

interface BlogPost {
  slug: string
  dateLabel: string
  title: string
  excerpt: string
  tags: string[]
  track: string
}

async function getLatestPosts(count: number = 3): Promise<BlogPost[]> {
  // Fetch from the blog API or hardcode latest posts
  const res = await fetch(`${BLOG_URL}/api/posts`)
  if (!res.ok) return []
  const posts = await res.json()
  return posts.slice(0, count)
}

function renderPostCard(post: BlogPost): string {
  return `
    <div style="background:#111;border:1px solid #222;padding:20px;margin-bottom:12px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#fff;">${post.title}</p>
      <p style="margin:0 0 8px;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.1em;">${post.dateLabel} · ${post.track}</p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#999;">${post.excerpt}</p>
      <a href="${BLOG_URL}/posts/${post.slug}" style="display:inline-block;margin-top:12px;font-size:11px;color:#8b5cf6;text-decoration:none;text-transform:uppercase;letter-spacing:0.1em;">Read More →</a>
    </div>
  `
}

function renderEmail(userName: string, posts: BlogPost[]): string {
  const postCards = posts.map(renderPostCard).join('')
  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:monospace;background:#000;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#000;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0a;border:1px solid #1a1a1a;">
        <tr><td style="padding:32px 40px 0;border-bottom:1px solid #1a1a1a;">
          <span style="font-size:14px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#fff;">🦞 AGENTBOT — WEEKLY DIGEST</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 16px;">This Week at Agentbot</h1>
          <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 8px;">Hey ${userName},</p>
          <p style="font-size:15px;line-height:1.7;color:#ccc;margin:0 0 32px;">Here is what shipped, what changed, and what is coming next.</p>
          
          <h2 style="font-size:16px;font-weight:700;color:#fff;margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid #222;">Latest Posts</h2>
          ${postCards}
          
          <h2 style="font-size:16px;font-weight:700;color:#fff;margin:32px 0 16px;padding-bottom:8px;border-bottom:1px solid #222;">Quick Links</h2>
          <p style="font-size:13px;line-height:2;color:#999;margin:0 0 24px;">
            <a href="${BLOG_URL}" style="color:#8b5cf6;text-decoration:none;">View All Posts</a><br>
            <a href="${DISCORD_URL}" style="color:#8b5cf6;text-decoration:none;">Join Discord</a><br>
            <a href="https://agentbot.sh/dashboard" style="color:#8b5cf6;text-decoration:none;">Open Dashboard</a>
          </p>
          
          <p style="font-size:13px;color:#888;margin:32px 0 0;">&mdash; The Agentbot Team</p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:0.1em;">
            <a href="https://agentbot.sh" style="color:#555;text-decoration:none;">agentbot.sh</a>
            &nbsp;&middot;&nbsp;
            <a href="${DISCORD_URL}" style="color:#555;text-decoration:none;">Discord</a>
            &nbsp;&middot;&nbsp;
            <a href="${BLOG_URL}" style="color:#555;text-decoration:none;">Blog</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function main() {
  console.log('📬 Starting weekly digest send...')

  // Get users from database
  const users = await prisma.user.findMany({
    where: { subscriptionStatus: 'active' },
    select: { email: true, name: true },
  })

  if (users.length === 0) {
    console.log('No active users found. Sending test to eskyjunglelab@gmail.com')
    const posts = await getLatestPosts(3)
    const html = renderEmail('Esky', posts)
    const result = await resend.emails.send({
      from: 'Agentbot <noreply@agentbot.sh>',
      to: 'eskyjunglelab@gmail.com',
      subject: `Agentbot Weekly — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      html,
    })
    console.log('Test sent:', result.data?.id)
    return
  }

  console.log(`Sending to ${users.length} users...`)

  // Get latest posts
  const posts = await getLatestPosts(3)

  // Send to each user
  for (const user of users) {
    try {
      const name = user.name || user.email?.split('@')[0] || 'there'
      const html = renderEmail(name, posts)
      await resend.emails.send({
        from: 'Agentbot <noreply@agentbot.sh>',
        to: user.email!,
        subject: `Agentbot Weekly — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
        html,
      })
      console.log(`✅ Sent to ${user.email}`)
    } catch (err) {
      console.error(`❌ Failed to send to ${user.email}:`, err)
    }
  }

  console.log(`📬 Weekly digest sent to ${users.length} users`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
