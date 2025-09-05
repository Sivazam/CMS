import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, PaymentStatus, NotificationType } from "@prisma/client"

const RENEWAL_RATE_PER_MONTH = 300

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { storageId, renewalMonths, paymentMethod, paymentAmount, transactionId } = await request.json()

    // Validate required fields
    if (!storageId || !renewalMonths || !paymentMethod || !paymentAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate payment amount
    const expectedAmount = renewalMonths * RENEWAL_RATE_PER_MONTH
    if (paymentAmount < expectedAmount) {
      return NextResponse.json(
        { error: `Payment amount must be at least ₹${expectedAmount} for ${renewalMonths} month(s)` },
        { status: 400 }
      )
    }

    // Get the storage record
    const storage = await db.storage.findUnique({
      where: { id: storageId },
      include: {
        customer: true,
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
        { error: "You can only renew storage for your assigned location" },
        { status: 403 }
      )
    }

    // Calculate new expiry date
    const currentExpiryDate = new Date(storage.expiryDate)
    const newExpiryDate = new Date(currentExpiryDate)
    newExpiryDate.setMonth(newExpiryDate.getMonth() + renewalMonths)

    // Update storage record
    const updatedStorage = await db.storage.update({
      where: { id: storageId },
      data: {
        expiryDate: newExpiryDate,
        status: "ACTIVE" // Reset to active status
      },
      include: {
        customer: true,
        operator: true,
        location: true
      }
    })

    // Create payment record
    const payment = await db.payment.create({
      data: {
        storageId: storageId,
        amount: parseFloat(paymentAmount),
        status: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        method: paymentMethod.toUpperCase(),
        transactionId: transactionId || null,
        operatorId: session.user.id
      }
    })

    // Create notification for renewal
    await db.notification.create({
      data: {
        type: NotificationType.RENEWAL_CONFIRMATION,
        message: `Storage renewed for ${storage.customer.name} for ${renewalMonths} month(s). New expiry date: ${newExpiryDate.toLocaleDateString()}`,
        status: "PENDING",
        storageId: storageId,
        operatorId: session.user.id
      }
    })

    // TODO: Send SMS confirmation to customer
    // This would integrate with an SMS service

    return NextResponse.json({
      success: true,
      storage: {
        id: updatedStorage.id,
        customerName: updatedStorage.customer.name,
        numberOfPots: updatedStorage.numberOfPots,
        previousExpiryDate: currentExpiryDate,
        newExpiryDate: newExpiryDate,
        renewalMonths,
        payment: {
          amount: payment.amount,
          method: payment.method,
          transactionId: payment.transactionId
        }
      }
    })

  } catch (error) {
    console.error("Storage renewal error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}