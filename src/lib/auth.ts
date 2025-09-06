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
        console.log("Authorize attempt:", credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials")
          return null
        }

        try {
          // Authenticate with Firebase
          console.log("Attempting Firebase authentication...")
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          )
          
          const firebaseUser = userCredential.user
          console.log("Firebase auth successful:", firebaseUser.uid)

          // Get user data from Firestore
          console.log("Fetching user from Firestore...")
          let user
          try {
            user = await userService.getByEmail(credentials.email)
          } catch (firestoreError) {
            console.log("Error fetching from Firestore:", firestoreError)
            // If Firestore fails, create a minimal user object from Firebase Auth data
            user = {
              id: firebaseUser.uid,
              email: firebaseUser.email || credentials.email,
              name: firebaseUser.displayName || credentials.email,
              role: "OPERATOR", // Default role for fallback
              phone: firebaseUser.phoneNumber,
              isActive: true,
              assignedLocationId: null
            }
          }

          if (!user) {
            console.log("User not found in Firestore")
            return null
          }

          if (!user.isActive) {
            console.log("User is not active:", user.isActive)
            return null
          }

          console.log("User authenticated successfully:", user.id)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            isActive: user.isActive,
            assignedLocationId: user.assignedLocationId
          }
        } catch (error: any) {
          console.error("Authentication error:", error.code, error.message)
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
      console.log("JWT callback:", { token, user })
      if (user) {
        token.role = user.role
        token.phone = user.phone
        token.isActive = user.isActive
        token.assignedLocationId = user.assignedLocationId
      }
      return token
    },
    async session({ session, token }) {
      console.log("Session callback:", { session, token })
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
  debug: true // Enable debug mode for troubleshooting
}