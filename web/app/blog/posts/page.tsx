import { redirect } from 'next/navigation'

// /blog/posts has individual post pages but no index of its own — send
// visitors to the real blog index instead of 404ing.
export default function BlogPostsIndex() {
  redirect('/blog')
}
