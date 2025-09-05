import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const locations = await db.location.findMany({
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            customers: true,
            storages: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error("Get locations error:", error)
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

    const { name, address, capacity } = await request.json()

    // Validate required fields
    if (!name || !address || !capacity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const location = await db.location.create({
      data: {
        name,
        address,
        capacity: parseInt(capacity)
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error("Create location error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}