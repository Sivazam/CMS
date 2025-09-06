export interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'ADMIN' | 'OPERATOR'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string // For operators created by admin
  assignedLocationId?: string
}

export interface Location {
  id: string
  name: string
  address: string
  contactNumber: string
  createdAt: Date
  updatedAt: Date
  operatorId?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  address: string
  email?: string
  operatorId: string
  locationId: string
  createdAt: Date
  updatedAt: Date
}

export interface Storage {
  id: string
  customerId: string
  numberOfPots: number
  registrationDate: Date
  expiryDate: Date
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'DELIVERED'
  operatorId: string
  locationId: string
  createdAt: Date
  updatedAt: Date
  payments: Payment[]
  notifications: Notification[]
}

export interface Payment {
  id: string
  storageId: string
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  paymentDate?: Date
  method: 'UPI' | 'CASH' | 'QR'
  transactionId?: string
  operatorId: string
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  type: 'REGISTRATION' | 'RENEWAL_REMINDER' | 'FINAL_WARNING' | 'RENEWAL_CONFIRMATION' | 'DELIVERY_CONFIRMATION'
  message: string
  status: 'PENDING' | 'SENT' | 'FAILED'
  sentAt?: Date
  storageId: string
  operatorId: string
  createdAt: Date
  updatedAt: Date
}

export interface OTP {
  id: string
  code: string
  phone: string
  purpose: 'CUSTOMER_VERIFICATION' | 'DELIVERY_VERIFICATION'
  expiresAt: Date
  isUsed: boolean
  createdAt: Date
}