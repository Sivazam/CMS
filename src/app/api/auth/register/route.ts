import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/lib/firebase-service"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, role, isActive = true } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists in Firebase Auth
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: error.message || "Failed to create user in Firebase Auth" },
        { status: 500 }
      )
    }

    // Create user in Firestore
    const userData = {
      name,
      email,
      phone: phone || null,
      role,
      isActive
    }

    const user = await userService.create(userData)

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}