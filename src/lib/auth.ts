import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { userService } from "@/lib/firebase-service"
import { auth } from "@/lib/firebase"
import { signInWithEmailAndPassword } from "firebase/auth"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Authenticate with Firebase
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          )
          
          const firebaseUser = userCredential.user

          // Get user data from Firestore
          const user = await userService.getByEmail(credentials.email)

          if (!user || !user.isActive) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            isActive: user.isActive,
            assignedLocationId: user.assignedLocationId
          }
        } catch (error) {
          console.error("Authentication error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.phone = user.phone
        token.isActive = user.isActive
        token.assignedLocationId = user.assignedLocationId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.phone = token.phone as string
        session.user.isActive = token.isActive as boolean
        session.user.assignedLocationId = token.assignedLocationId as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup"
  },
  secret: process.env.NEXTAUTH_SECRET,
}