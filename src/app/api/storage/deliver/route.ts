import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, StorageStatus, NotificationType } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { storageId, deliveryNotes, receiverName, receiverRelation, digitalSignature } = await request.json()

    // Validate required fields
    if (!storageId || !receiverName || !receiverRelation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get the storage record
    const storage = await db.storage.findUnique({
      where: { id: storageId },
      include: {
        customer: true,
        location: true,
        payments: true
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
        { error: "You can only deliver storage for your assigned location" },
        { status: 403 }
      )
    }

    // Check if storage is already delivered
    if (storage.status === StorageStatus.DELIVERED) {
      return NextResponse.json(
        { error: "Storage has already been delivered" },
        { status: 400 }
      )
    }

    // Final check for pending dues
    const totalPaid = storage.payments.reduce((sum, payment) => {
      return sum + (payment.status === "COMPLETED" ? payment.amount : 0)
    }, 0)

    const registrationDate = new Date(storage.registrationDate)
    const expiryDate = new Date(storage.expiryDate)
    const monthsCovered = Math.ceil((expiryDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    const expectedPayment = 500 + Math.max(0, (monthsCovered - 1) * 300)

    if (totalPaid < expectedPayment) {
      return NextResponse.json(
        { error: "Cannot deliver storage with pending dues. Please clear all payments first." },
        { status: 400 }
      )
    }

    // Update storage status to delivered
    const updatedStorage = await db.storage.update({
      where: { id: storageId },
      data: {
        status: StorageStatus.DELIVERED
      },
      include: {
        customer: true,
        operator: true,
        location: true
      }
    })

    // Create delivery record (you might want to create a separate Delivery model)
    // For now, we'll store delivery information in a notification
    const deliveryNotification = await db.notification.create({
      data: {
        type: NotificationType.DELIVERY_CONFIRMATION,
        message: `Ash pots delivered to ${receiverName} (${receiverRelation}) on behalf of ${storage.customer.name}. ${deliveryNotes ? `Notes: ${deliveryNotes}` : ''}`,
        status: "COMPLETED",
        storageId: storageId,
        operatorId: session.user.id,
        sentAt: new Date()
      }
    })

    // TODO: Send SMS confirmation to customer and admin
    // This would integrate with an SMS service
    // Example SMS content: "Your ash pots have been delivered to ${receiverName}. Thank you for using SCM System."

    // TODO: Generate and store delivery receipt
    // This would create a PDF receipt and store it for future reference

    return NextResponse.json({
      success: true,
      delivery: {
        storageId: updatedStorage.id,
        customerName: updatedStorage.customer.name,
        numberOfPots: updatedStorage.numberOfPots,
        deliveryDate: new Date(),
        receiverName,
        receiverRelation,
        deliveryNotes,
        operatorName: session.user.name,
        locationName: updatedStorage.location.name,
        digitalSignature: digitalSignature || null
      },
      notification: {
        id: deliveryNotification.id,
        message: deliveryNotification.message
      }
    })

  } catch (error) {
    console.error("Storage delivery error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}