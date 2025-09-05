import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") as UserRole
    const locationId = searchParams.get("locationId")

    const where: any = {}
    if (role) where.role = role
    if (locationId) where.assignedLocation = { id: locationId }

    const users = await db.user.findMany({
      where,
      include: {
        assignedLocation: true,
        createdOperators: true,
        _count: {
          select: {
            customers: true,
            storages: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword
    })

    return NextResponse.json(usersWithoutPasswords)
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, email, phone, password, role, locationId } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const bcrypt = await import("bcryptjs")
    const hashedPassword = await bcrypt.default.hash(password, 12)

    // Create user
    const userData: any = {
      name,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: role as UserRole,
      createdBy: session.user.id
    }

    if (locationId && role === UserRole.OPERATOR) {
      userData.assignedLocation = {
        connect: { id: locationId }
      }
    }

    const user = await db.user.create({
      data: userData,
      include: {
        assignedLocation: true,
        createdOperators: true
      }
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error("Create user error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}