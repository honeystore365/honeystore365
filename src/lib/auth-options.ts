import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCustomerByEmail } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const customer = await getCustomerByEmail(credentials.email);
        if (!customer) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          customer.password_hash as string
        );

        if (!isValid) {
          return null;
        }

        return {
          id: customer.id as string,
          email: customer.email as string,
          name: `${customer.first_name || ""} ${customer.last_name || ""}`.trim(),
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
