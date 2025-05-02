import NextAuth, { NextAuthOptions, User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosResponse } from "axios";
import { JWT } from "next-auth/jwt";
import { CustomSession } from "./types";
interface Credentials {
  username: string;
  password: string;
}
interface LoginResponse {
  userId: string;
  accessToken: string;
}
interface CustomUser extends User {
  id: string;
  accessToken: string;
}

interface CustomToken extends JWT {
  id?: string;
  accessToken?: string;
}
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Credentials | undefined): Promise<CustomUser | null> {
        if (!credentials || !credentials.username || !credentials.password) {
          return null;
        }
        try {
          const response: AxiosResponse<LoginResponse> = await axios.post("http://localhost:8080/api/v1/auth/login", {
            username: credentials.username,
            password: credentials.password,
          });
          if (response.data && response.data.accessToken) {
            return {
              id: response.data.userId,
              accessToken: response.data.accessToken,
            };
          }
          return null;
        } catch (error) {
          console.error("Đăng nhập thất bại:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = (user as CustomUser).id!;
        token.accessToken = (user as CustomUser).accessToken!;
      }
      return token;
    },
    async session({ session, token }): Promise<CustomSession> {
      if (session.user) {
        (session.user as CustomUser).id = (token as CustomToken).id as string;
        (session.user as CustomUser).accessToken = (token as CustomToken).accessToken as string;
      }
      return session as CustomSession;
    },
  },
};


export const handler = NextAuth(authOptions);

