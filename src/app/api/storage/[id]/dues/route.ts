import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const storageId = params.id

    // Get storage with payments
    const storage = await db.storage.findUnique({
      where: { id: storageId },
      include: {
        payments: {
          orderBy: {
            paymentDate: "desc"
          }
        },
        location: true
      }
    })

    if (!storage) {
      return NextResponse.json(
        { error: "Storage record not found" },
        { status: 404 }
      )
    }

    // Check if operator has access to the location
    if (session.user.role === UserRole.OPERATOR && storage.locationId !== session.user.locationId) {
      return NextResponse.json(
        { error: "You can only access storage for your assigned location" },
        { status: 403 }
      )
    }

    // Calculate renewal periods and expected payments
    const registrationDate = new Date(storage.registrationDate)
    const expiryDate = new Date(storage.expiryDate)
    const monthsCovered = Math.ceil((expiryDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    
    // Expected payment: ₹500 initial + ₹300 per additional month
    const expectedPayment = 500 + Math.max(0, (monthsCovered - 1) * 300)
    
    // Total actual payments
    const totalPaid = storage.payments.reduce((sum, payment) => {
      return sum + (payment.status === "COMPLETED" ? payment.amount : 0)
    }, 0)

    const hasPendingDues = totalPaid < expectedPayment
    const totalDue = Math.max(0, expectedPayment - totalPaid)

    // Check for overdue payments (simplified logic)
    const overduePayments = storage.payments
      .filter(payment => payment.status === "PENDING")
      .map(payment => ({
        id: payment.id,
        amount: payment.amount,
        dueDate: payment.paymentDate || new Date().toISOString()
      }))

    const response = {
      hasPendingDues,
      totalDue,
      totalPaid,
      expectedPayment,
      overduePayments,
      payments: storage.payments,
      storageDetails: {
        numberOfPots: storage.numberOfPots,
        registrationDate: storage.registrationDate,
        expiryDate: storage.expiryDate,
        monthsCovered
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Check dues error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}