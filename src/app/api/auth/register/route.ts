import { NextRequest, NextResponse } from "next/server"
import { userService } from "@/lib/firebase-service"
import { auth } from "@/lib/firebase"
import { createUserWithEmailAndPassword } from "firebase/auth"

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, role, isActive = true } = await request.json()

    console.log("Registration attempt:", { email, name, role, isActive })

    // Validate required fields
    if (!name || !email || !password || !role) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists in Firestore first
    try {
      const existingUser = await userService.getByEmail(email)
      if (existingUser) {
        console.log("User already exists in Firestore")
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        )
      }
    } catch (error) {
      console.log("Error checking existing user (likely due to security rules):", error)
      // Continue with Firebase Auth creation even if Firestore check fails
    }

    // Create user in Firebase Auth
    let userCredential
    try {
      console.log("Creating Firebase Auth user...")
      userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("Firebase Auth user created successfully:", userCredential.user.uid)
    } catch (error: any) {
      console.error("Firebase Auth error:", error.code, error.message)
      if (error.code === "auth/email-already-in-use") {
        return NextResponse.json(
          { error: "User with this email already exists in Firebase Auth" },
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
      isActive,
      createdBy: role === "OPERATOR" ? "system" : null,
      assignedLocationId: null
    }

    console.log("Creating Firestore user with data:", userData)

    try {
      const user = await userService.create(userData)
      console.log("Firestore user created successfully:", user.id)
      
      return NextResponse.json({ 
        success: true, 
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        message: "User created successfully" 
      }, { status: 201 })
    } catch (firestoreError) {
      console.error("Firestore user creation error:", firestoreError)
      
      // If Firestore creation fails due to security rules, we'll still consider the signup successful
      // since the Firebase Auth user was created. The user can be created in Firestore later.
      if (firestoreError.code === 'permission-denied') {
        console.log("Firestore permission denied, but Firebase Auth user created")
        return NextResponse.json({ 
          success: true, 
          user: { id: userCredential.user.uid, email, name, role },
          message: "User created in Firebase Auth. Firestore setup required.",
          firestoreError: "Security rules need to be updated in Firebase console"
        }, { status: 201 })
      }
      
      return NextResponse.json(
        { error: "Failed to create user record in database" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}