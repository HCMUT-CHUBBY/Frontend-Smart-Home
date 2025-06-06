
// lib/auth.ts
import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios, { AxiosError, AxiosResponse } from "axios";
import https from 'https'; // <<< QUAN TRỌNG: Import module https
import { JWT } from "next-auth/jwt";
import { CustomSession } from "./types"; // Đảm bảo type này đúng

// --- Interfaces ---
interface Credentials {
  username: string;
  password: string;
}

interface LoginResponse {
  userId: string | number; // userId có thể là string hoặc number từ backend
  accessToken: string;
  // username?: string; // Thêm nếu backend trả về
}

interface CustomUser extends NextAuthUser {
  id: string; // Bắt buộc là string cho NextAuth
  accessToken: string;
  // name?: string | null;
  // email?: string | null;
  // userIdFromBackend?: string | number;
}

interface CustomToken extends JWT {
  id?: string;
  accessToken?: string;
  // name?: string | null;
  // email?: string | null;
  // userIdFromBackend?: string | number;
}

// --- authOptions ---

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

// <<< TẠO AXIOS AGENT CHO MÔI TRƯỜNG DEVELOPMENT >>>
let httpsAgentForDev: https.Agent | undefined;
if (process.env.NODE_ENV === 'development') {
  if (!apiBaseUrl || !apiBaseUrl.startsWith('https://localhost')) {
    console.warn("[AUTH] Skipping httpsAgent creation for non-localhost or undefined API base URL in development.");
  } else {
    httpsAgentForDev = new https.Agent({
      rejectUnauthorized: false // Bỏ qua kiểm tra SSL cho self-signed certs khi gọi localhost
    });
    console.log("[AUTH] Development mode: SSL certificate validation will be bypassed for HTTPS calls to localhost using httpsAgent.");
  }
}


export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Credentials | undefined): Promise<CustomUser | null> {
        console.log("[AUTH] Authorize function called.");

        if (!credentials?.username || !credentials?.password) {
          console.error("[AUTH_ERROR] Authorize: Missing username or password.");
          return null;
        }

        if (!apiBaseUrl) {
          console.error("[AUTH_ERROR] Authorize: NEXT_PUBLIC_API_BASE_URL is not set.");
          return null;
        }

        const loginUrl = `${apiBaseUrl}/auth/login`;
        console.log(`[AUTH] Attempting login for user: ${credentials.username} to URL: ${loginUrl}`);

        try {
          // Tạo Axios config object
          const axiosConfig: import("axios").AxiosRequestConfig = { // Sử dụng AxiosRequestConfig thay cho 'any'
            headers: {
              "Content-Type": "application/json",
            },
          };

          // Chỉ thêm httpsAgent nếu đang trong development và target là localhost HTTPS
          if (process.env.NODE_ENV === 'development' && loginUrl.startsWith('https://localhost') && httpsAgentForDev) {
            axiosConfig.httpsAgent = httpsAgentForDev;
          }

          const response: AxiosResponse<LoginResponse> = await axios.post(
            loginUrl,
            {
              username: credentials.username,
              password: credentials.password,
            },
            axiosConfig // Truyền config đã tạo
          );

          console.log("[AUTH] Backend API response status:", response.status);
          // console.log("[AUTH] Backend API response data:", JSON.stringify(response.data, null, 2));

          if (response.data && response.data.accessToken && response.data.userId !== undefined) { // Kiểm tra userId rõ ràng hơn
            console.log("[AUTH] Login successful. AccessToken and UserId received.");
            return {
              id: String(response.data.userId), // QUAN TRỌNG: Chuyển userId sang string
              accessToken: response.data.accessToken,
              // name: response.data.username || credentials.username,
            };
          } else {
            console.error("[AUTH_ERROR] Authorize: Login failed. API response missing accessToken or userId.", {
              responseStatus: response.status,
              responseData: response.data, // Log data để xem có gì
              hasAccessToken: !!response.data?.accessToken,
              hasUserId: response.data?.userId !== undefined,
            });
            return null;
          }
        } catch (error) {
          console.error("[AUTH_ERROR] Authorize: Error during login attempt.");
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<unknown>; // Thêm kiểu cho data lỗi
            const errorDetails = {
              message: axiosError.message,
              code: axiosError.code,
              status: axiosError.response?.status,
              data: axiosError.response?.data, // Giữ nguyên object để dễ xem hơn là JSON.stringify
              url: axiosError.config?.url,
              method: axiosError.config?.method,
            };
            console.error("[AUTH_ERROR] Axios error details:", errorDetails);
            if (axiosError.code === 'DEPTH_ZERO_SELF_SIGNED_CERT' || axiosError.message.includes('self-signed certificate')) {
              console.error("[AUTH_ERROR] SELF-SIGNED CERTIFICATE ISSUE. The httpsAgent for development might not have been applied or is not effective for this request.");
            }
          } else if (error instanceof Error) {
            console.error("[AUTH_ERROR] Non-Axios error details:", error.message, error.stack);
          } else {
            console.error("[AUTH_ERROR] Unknown error type:", error);
          }
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
    async jwt({ token, user, account }) {
      if (account && user) {
        const customUser = user as CustomUser;
        console.log("[AUTH_CALLBACK_JWT] Initial sign in. Populating token:", { id: customUser.id, hasAccessToken: !!customUser.accessToken });
        token.id = customUser.id;
        token.accessToken = customUser.accessToken;
        // token.name = customUser.name;
        // token.email = customUser.email;
      }
      return token as CustomToken;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.accessToken) {
        const userInSession = session.user as CustomUser;
        userInSession.id = token.id as string;
        userInSession.accessToken = token.accessToken as string;
        // userInSession.name = token.name as string | null;
        // userInSession.email = token.email as string | null;
      } else {
        console.warn("[AUTH_CALLBACK_SESSION] Session or token missing expected fields for population.");
      }
      return session as CustomSession;
    },
  },
  // debug: process.env.NODE_ENV === 'development', // Bật nếu cần thêm log từ NextAuth
};

export default NextAuth(authOptions);