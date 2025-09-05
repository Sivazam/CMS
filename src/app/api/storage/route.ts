import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, StorageStatus } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") as StorageStatus
    const locationId = searchParams.get("locationId")
    const sortBy = searchParams.get("sortBy") || "expiryDate"

    const where: any = {}
    
    // Filter by status
    if (status && status !== "ALL") {
      where.status = status
    }
    
    // Filter by location (operators can only see their location)
    if (session.user.role === UserRole.OPERATOR) {
      where.locationId = session.user.locationId
    } else if (locationId && locationId !== "ALL") {
      where.locationId = locationId
    }

    // Update expiring status
    await updateExpiringStatus()

    const storages = await db.storage.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
            email: true
          }
        },
        operator: {
          select: {
            id: true,
            name: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentDate: true,
            method: true
          },
          orderBy: {
            paymentDate: "desc"
          }
        }
      },
      orderBy: getOrderBy(sortBy)
    })

    return NextResponse.json(storages)
  } catch (error) {
    console.error("Get storage error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function updateExpiringStatus() {
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Update active storages that are expiring within 7 days
  await db.storage.updateMany({
    where: {
      status: StorageStatus.ACTIVE,
      expiryDate: {
        lte: sevenDaysFromNow
      }
    },
    data: {
      status: StorageStatus.EXPIRING
    }
  })

  // Update expired storages
  await db.storage.updateMany({
    where: {
      status: {
        in: [StorageStatus.ACTIVE, StorageStatus.EXPIRING]
      },
      expiryDate: {
        lt: now
      }
    },
    data: {
      status: StorageStatus.EXPIRED
    }
  })
}

function getOrderBy(sortBy: string) {
  switch (sortBy) {
    case "registrationDate":
      return { registrationDate: "desc" }
    case "customerName":
      return { customer: { name: "asc" } }
    case "expiryDate":
    default:
      return { expiryDate: "asc" }
  }
}