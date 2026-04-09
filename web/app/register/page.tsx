import { redirect } from 'next/navigation'

// /register → /signup (canonical route)
export default function RegisterPage() {
  redirect('/signup')
}
