import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole, StorageStatus, PaymentStatus, NotificationType } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const {
      customerType,
      existingCustomerId,
      name,
      phone,
      email,
      address,
      locationId,
      numberOfPots,
      registrationDate,
      paymentMethod,
      paymentAmount,
      transactionId
    } = await request.json()

    // Validate required fields
    if (!locationId || !numberOfPots || !registrationDate || !paymentMethod || !paymentAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if operator has access to the location
    if (session.user.role === UserRole.OPERATOR && session.user.locationId !== locationId) {
      return NextResponse.json(
        { error: "You can only create entries for your assigned location" },
        { status: 403 }
      )
    }

    // Get or create customer
    let customer
    if (customerType === "existing" && existingCustomerId) {
      customer = await db.customer.findUnique({
        where: { id: existingCustomerId }
      })
      
      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        )
      }
    } else {
      // Create new customer
      customer = await db.customer.create({
        data: {
          name,
          phone,
          email: email || null,
          address,
          operatorId: session.user.id,
          locationId
        }
      })
    }

    // Calculate expiry date (1 month from registration)
    const registrationDateObj = new Date(registrationDate)
    const expiryDate = new Date(registrationDateObj)
    expiryDate.setMonth(expiryDate.getMonth() + 1)

    // Create storage entry
    const storage = await db.storage.create({
      data: {
        customerId: customer.id,
        numberOfPots: parseInt(numberOfPots),
        registrationDate: registrationDateObj,
        expiryDate,
        status: StorageStatus.ACTIVE,
        operatorId: session.user.id,
        locationId
      }
    })

    // Create payment record
    const payment = await db.payment.create({
      data: {
        storageId: storage.id,
        amount: parseFloat(paymentAmount),
        status: PaymentStatus.COMPLETED,
        paymentDate: new Date(),
        method: paymentMethod.toUpperCase(),
        transactionId: transactionId || null,
        operatorId: session.user.id
      }
    })

    // Create notification for registration
    await db.notification.create({
      data: {
        type: NotificationType.REGISTRATION,
        message: `New ash pot entry registered for ${customer.name} with ${numberOfPots} pots`,
        status: "PENDING",
        storageId: storage.id,
        operatorId: session.user.id
      }
    })

    // TODO: Send SMS notification to customer and admin
    // This would integrate with an SMS service

    return NextResponse.json({
      success: true,
      storage: {
        id: storage.id,
        customer: customer.name,
        numberOfPots: storage.numberOfPots,
        registrationDate: storage.registrationDate,
        expiryDate: storage.expiryDate,
        payment: {
          amount: payment.amount,
          method: payment.method
        }
      }
    })

  } catch (error) {
    console.error("Storage creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}