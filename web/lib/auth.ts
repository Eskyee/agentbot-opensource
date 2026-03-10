import NextAuth from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const auth = NextAuth(authOptions);

export { auth };
