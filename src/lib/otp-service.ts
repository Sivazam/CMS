import { otpService } from "./firebase-service"

export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export const createOTP = async (phone: string, purpose: 'CUSTOMER_VERIFICATION' | 'DELIVERY_VERIFICATION'): Promise<string> => {
  const otp = generateOTP()
  const expiresAt = new Date(Date.now() + 9 * 60 * 1000) // 9 minutes from now

  await otpService.create({
    code: otp,
    phone,
    purpose,
    expiresAt,
    isUsed: false
  })

  return otp
}

export const verifyOTP = async (phone: string, code: string, purpose: string): Promise<boolean> => {
  return await otpService.verify(phone, code, purpose)
}