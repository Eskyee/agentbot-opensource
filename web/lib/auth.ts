import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth";

const auth = NextAuth(authOptions);

export { auth };
