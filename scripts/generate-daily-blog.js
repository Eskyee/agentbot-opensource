const fs = require('fs');
const path = require('path');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function fetchOpenClawNews() {
  try {
    // Fetch latest from OpenClaw GitHub
    const response = await fetch('https://api.github.com/repos/OpenClaw/openclaw/commits?per_page=5');
    const commits = await response.json();
    
    // Fetch releases
    const releasesResponse = await fetch('https://api.github.com/repos/OpenClaw/openclaw/releases?per_page=3');
    const releases = await releasesResponse.json();
    
    return {
      commits: commits.map(c => ({
        message: c.commit.message,
        date: c.commit.author.date,
        url: c.html_url
      })),
      releases: releases.map(r => ({
        name: r.name,
        body: r.body,
        date: r.published_at,
        url: r.html_url
      }))
    };
  } catch (error) {
    console.log('Could not fetch OpenClaw updates, using general content');
    return null;
  }
}

async function generateBlogPost() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const slug = `daily-${today.toISOString().split('T')[0]}`;
  
  // Fetch OpenClaw news
  const openclawNews = await fetchOpenClawNews();
  
  let contextPrompt = `Write a blog post for ${dateStr} about one of these topics:
- Platform improvements or new features
- AI agent deployment tips
- Tutorial or how-to guide
- Best practices for production agents`;

  if (openclawNews) {
    contextPrompt += `\n\nInclude updates from OpenClaw framework:
Recent commits: ${openclawNews.commits.map(c => c.message).join(', ')}
Recent releases: ${openclawNews.releases.map(r => r.name).join(', ')}

Mention what's new in OpenClaw and how it benefits Agentbot users.`;
  }
  
  // Generate blog content using OpenAI
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'You are a technical writer for Agentbot, an AI agent deployment platform built on OpenClaw. Write engaging, informative blog posts about platform updates, OpenClaw framework improvements, and AI agent best practices. Keep posts concise (300-500 words).'
      }, {
        role: 'user',
        content: contextPrompt + '\n\nFormat as JSON with: title, excerpt (1 sentence), tags (array of 2), content (markdown with ## headings, paragraphs, and bullet lists)'
      }],
      temperature: 0.8
    })
  });

  const data = await response.json();
  const post = JSON.parse(data.choices[0].message.content);
  
  // Create blog post file
  const postContent = `import Link from 'next/link';

export default function Post() {
  return (
    <main className="min-h-screen px-6 py-16 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="text-gray-400 hover:text-white mb-8 inline-block">
          ← Back to Blog
        </Link>
        
        <article className="prose prose-invert max-w-none">
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-2">${dateStr}</p>
            <h1 className="text-4xl font-bold mb-4">${post.title}</h1>
            <div className="flex gap-2">
              ${post.tags.map(tag => `<span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">${tag}</span>`).join('\n              ')}
            </div>
          </div>

          ${post.content.split('\n').map(line => {
            if (line.startsWith('## ')) {
              return `<h2 className="text-2xl font-bold mt-8 mb-4">${line.replace('## ', '')}</h2>`;
            } else if (line.startsWith('- ')) {
              return `<li>${line.replace('- ', '')}</li>`;
            } else if (line.trim()) {
              return `<p className="text-gray-300 mb-4">${line}</p>`;
            }
            return '';
          }).join('\n          ')}

          <div className="mt-12 p-6 rounded-xl bg-gray-900 border border-gray-800">
            <p className="text-gray-300 mb-4">Deploy your AI agent today</p>
            <Link href="/signup" className="inline-block bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </article>
      </div>
    </main>
  );
}
`;

  // Write post file
  const postDir = path.join(__dirname, '..', 'web', 'app', 'blog', 'posts', slug);
  fs.mkdirSync(postDir, { recursive: true });
  fs.writeFileSync(path.join(postDir, 'page.tsx'), postContent);
  
  // Update blog index
  const blogIndexPath = path.join(__dirname, '..', 'web', 'app', 'blog', 'page.tsx');
  let blogIndex = fs.readFileSync(blogIndexPath, 'utf8');
  
  const newPost = `  {
    slug: '${slug}',
    date: '${dateStr}',
    title: '${post.title}',
    excerpt: '${post.excerpt}',
    tags: ${JSON.stringify(post.tags)}
  },`;
  
  blogIndex = blogIndex.replace('const blogPosts = [', `const blogPosts = [\n${newPost}`);
  fs.writeFileSync(blogIndexPath, blogIndex);
  
  console.log(`✅ Generated blog post: ${post.title}`);
}

generateBlogPost().catch(console.error);
