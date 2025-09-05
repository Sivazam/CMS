"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InputOTP } from "@/components/ui/input-otp"
import { 
  RefreshCw, 
  Shield, 
  CreditCard, 
  Smartphone,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Receipt
} from "lucide-react"
import { UserRole, StorageStatus } from "@prisma/client"

interface Storage {
  id: string
  numberOfPots: number
  registrationDate: string
  expiryDate: string
  status: StorageStatus
  customer: {
    id: string
    name: string
    phone: string
    address: string
  }
  location: {
    id: string
    name: string
  }
  payments: Array<{
    id: string
    amount: number
    paymentDate: string
    method: string
  }>
}

const steps = [
  { id: 1, name: "Select Storage", icon: Calendar },
  { id: 2, name: "OTP Verification", icon: Shield },
  { id: 3, name: "Payment", icon: CreditCard },
  { id: 4, name: "Confirmation", icon: CheckCircle },
]

const RENEWAL_RATE_PER_MONTH = 300

export default function RenewalSystemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [storages, setStorages] = useState<Storage[]>([])
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  
  // OTP state
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpResendLoading, setOtpResendLoading] = useState(false)
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null)
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [renewalMonths, setRenewalMonths] = useState(1)
  const [paymentAmount, setPaymentAmount] = useState(RENEWAL_RATE_PER_MONTH)
  const [transactionId, setTransactionId] = useState("")
  const [paymentProcessing, setPaymentProcessing] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      router.push("/dashboard")
      return
    }
    
    fetchStorages()
  }, [session, status, router])

  useEffect(() => {
    setPaymentAmount(renewalMonths * RENEWAL_RATE_PER_MONTH)
  }, [renewalMonths])

  const fetchStorages = async () => {
    try {
      const response = await fetch("/api/storage?status=ACTIVE&sortBy=expiryDate")
      if (response.ok) {
        const data = await response.json()
        setStorages(data)
      }
    } catch (error) {
      console.error("Failed to fetch storages:", error)
    }
  }

  const sendOTP = async () => {
    if (!selectedStorage) return
    
    setOtpLoading(true)
    setError("")
    
    try {
      // Simulate OTP sending - in real implementation, this would call an SMS service
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiry
      
      // Store OTP in localStorage for demo (in production, this would be server-side)
      localStorage.setItem(`otp_${selectedStorage.customer.phone}`, JSON.stringify({
        code: otpCode,
        expiry: expiryTime.toISOString()
      }))
      
      setOtpSent(true)
      setOtpExpiry(expiryTime)
      
      // Auto-verify for demo purposes
      setTimeout(() => {
        setOtp(otpCode)
      }, 1000)
      
    } catch (error) {
      setError("Failed to send OTP. Please try again.")
    } finally {
      setOtpLoading(false)
    }
  }

  const verifyOTP = async () => {
    if (!selectedStorage || !otp) return
    
    const storedOtpData = localStorage.getItem(`otp_${selectedStorage.customer.phone}`)
    if (!storedOtpData) {
      setError("OTP not found. Please request a new OTP.")
      return
    }
    
    const { code, expiry } = JSON.parse(storedOtpData)
    
    if (new Date() > new Date(expiry)) {
      setError("OTP has expired. Please request a new OTP.")
      return
    }
    
    if (code === otp) {
      setOtpVerified(true)
      localStorage.removeItem(`otp_${selectedStorage.customer.phone}`)
      setTimeout(() => setCurrentStep(3), 1000)
    } else {
      setError("Invalid OTP. Please try again.")
    }
  }

  const resendOTP = async () => {
    setOtpResendLoading(true)
    setOtp("")
    setError("")
    
    try {
      await sendOTP()
    } finally {
      setOtpResendLoading(false)
    }
  }

  const processPayment = async () => {
    if (!selectedStorage) return
    
    setPaymentProcessing(true)
    setError("")
    
    try {
      const response = await fetch("/api/storage/renew", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storageId: selectedStorage.id,
          renewalMonths,
          paymentMethod,
          paymentAmount,
          transactionId: transactionId || null
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Reset after successful renewal
        setTimeout(() => {
          router.push("/dashboard/storage")
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to process renewal")
      }
    } catch (error) {
      setError("An error occurred while processing payment")
    } finally {
      setPaymentProcessing(false)
    }
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <Label className="text-base font-medium">Select Storage to Renew</Label>
              <p className="text-sm text-slate-600 mt-1">Choose the storage record you want to renew</p>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {storages.map((storage) => (
                <Card 
                  key={storage.id} 
                  className={`cursor-pointer transition-all ${
                    selectedStorage?.id === storage.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedStorage(storage)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{storage.customer.name}</h3>
                        <p className="text-sm text-slate-600">{storage.customer.phone}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm">Pots: {storage.numberOfPots}</span>
                          <span className="text-sm">Location: {storage.location.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={storage.status === StorageStatus.ACTIVE ? "default" : "secondary"}>
                          {storage.status}
                        </Badge>
                        <p className="text-sm text-slate-600 mt-1">
                          Expires: {new Date(storage.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {storages.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No active storage records found for renewal</p>
              </div>
            )}
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Smartphone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Verify Customer Identity</h3>
              <p className="text-slate-600">
                We'll send a 6-digit OTP to {selectedStorage?.customer.phone}
              </p>
            </div>
            
            {!otpSent ? (
              <div className="text-center">
                <Button onClick={sendOTP} disabled={otpLoading} className="px-8">
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <Label className="text-base font-medium">Enter 6-digit OTP</Label>
                  <p className="text-sm text-slate-600 mt-1">
                    Valid for 5 minutes
                    {otpExpiry && (
                      <span className="ml-2">
                        (Expires in {Math.max(0, Math.ceil((new Date(otpExpiry).getTime() - Date.now()) / 60000))} mins)
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={otpVerified}
                  />
                </div>
                
                {otpVerified ? (
                  <div className="text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">OTP Verified Successfully!</p>
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <Button onClick={verifyOTP} disabled={otp.length !== 6}>
                      Verify OTP
                    </Button>
                    
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <span>Didn't receive OTP?</span>
                      <Button
                        variant="link"
                        onClick={resendOTP}
                        disabled={otpResendLoading}
                        className="p-0 h-auto text-blue-600"
                      >
                        {otpResendLoading ? "Resending..." : "Resend OTP"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <Label className="text-base font-medium">Renewal Period</Label>
              <Select value={renewalMonths.toString()} onValueChange={(value) => setRenewalMonths(parseInt(value))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 month - ₹{RENEWAL_RATE_PER_MONTH}</SelectItem>
                  <SelectItem value="2">2 months - ₹{RENEWAL_RATE_PER_MONTH * 2}</SelectItem>
                  <SelectItem value="3">3 months - ₹{RENEWAL_RATE_PER_MONTH * 3}</SelectItem>
                  <SelectItem value="6">6 months - ₹{RENEWAL_RATE_PER_MONTH * 6}</SelectItem>
                  <SelectItem value="12">12 months - ₹{RENEWAL_RATE_PER_MONTH * 12}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-medium">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(paymentMethod === "upi" || paymentMethod === "card") && (
              <div>
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter transaction ID"
                  className="mt-2"
                />
              </div>
            )}

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-green-900">Payment Summary</p>
                    <p className="text-sm text-green-700">
                      {renewalMonths} month{renewalMonths > 1 ? 's' : ''} renewal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-900">₹{paymentAmount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {success ? (
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-green-900 mb-2">Renewal Successful!</h3>
                <p className="text-green-700 mb-6">
                  Your storage has been renewed for {renewalMonths} month{renewalMonths > 1 ? 's' : ''}.
                  Redirecting to storage dashboard...
                </p>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Renewal Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Customer</p>
                        <p className="font-medium">{selectedStorage?.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Phone</p>
                        <p className="font-medium">{selectedStorage?.customer.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Ash Pots</p>
                        <p className="font-medium">{selectedStorage?.numberOfPots}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Location</p>
                        <p className="font-medium">{selectedStorage?.location.name}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Renewal Period</span>
                        <span className="font-medium">{renewalMonths} month{renewalMonths > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Rate per month</span>
                        <span className="font-medium">₹{RENEWAL_RATE_PER_MONTH}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Amount</span>
                        <span className="text-2xl font-bold">₹{paymentAmount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="text-center">
                  <Button 
                    onClick={processPayment} 
                    disabled={paymentProcessing}
                    className="px-8"
                  >
                    {paymentProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      "Confirm Payment & Renew"
                    )}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )

      default:
        return null
    }
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return selectedStorage !== null
      case 2:
        return otpVerified
      case 3:
        return paymentMethod && paymentAmount >= RENEWAL_RATE_PER_MONTH
      case 4:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        sendOTP()
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <span className="text-xl font-bold text-slate-900">Storage Renewal</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    <step.icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 ${currentStep > step.id ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              {steps.map((step) => (
                <span key={step.id} className={`text-sm ${currentStep >= step.id ? 'text-blue-600 font-medium' : 'text-slate-600'}`}>
                  {step.name}
                </span>
              ))}
            </div>
            <Progress value={(currentStep / steps.length) * 100} className="mt-4" />
          </div>

          {/* Form Content */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {getStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length && (
              <Button onClick={nextStep} disabled={!validateStep(currentStep)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}