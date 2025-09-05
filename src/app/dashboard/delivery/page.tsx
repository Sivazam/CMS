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
import { Textarea } from "@/components/ui/textarea"
import { 
  RefreshCw, 
  Shield, 
  Truck, 
  Smartphone,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Receipt,
  CreditCard,
  User,
  Calendar,
  MapPin,
  FileSignature
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
    status: string
  }>
}

interface PendingDues {
  hasPendingDues: boolean
  totalDue: number
  overduePayments: Array<{
    id: string
    amount: number
    dueDate: string
  }>
}

const steps = [
  { id: 1, name: "Select Storage", icon: Calendar },
  { id: 2, name: "Verify Dues", icon: CreditCard },
  { id: 3, name: "OTP Verification", icon: Shield },
  { id: 4, name: "Digital Handover", icon: FileSignature },
  { id: 5, name: "Confirmation", icon: CheckCircle },
]

export default function DeliverySystemPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [storages, setStorages] = useState<Storage[]>([])
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null)
  const [pendingDues, setPendingDues] = useState<PendingDues | null>(null)
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
  
  // Digital handover state
  const [deliveryNotes, setDeliveryNotes] = useState("")
  const [receiverName, setReceiverName] = useState("")
  const [receiverRelation, setReceiverRelation] = useState("")
  const [deliveryProcessing, setDeliveryProcessing] = useState(false)
  const [digitalSignature, setDigitalSignature] = useState("")

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      router.push("/dashboard")
      return
    }
    
    fetchStorages()
  }, [session, status, router])

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

  const checkPendingDues = async (storageId: string) => {
    try {
      const response = await fetch(`/api/storage/${storageId}/dues`)
      if (response.ok) {
        const data = await response.json()
        setPendingDues(data)
      }
    } catch (error) {
      console.error("Failed to check pending dues:", error)
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
      localStorage.setItem(`delivery_otp_${selectedStorage.customer.phone}`, JSON.stringify({
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
    
    const storedOtpData = localStorage.getItem(`delivery_otp_${selectedStorage.customer.phone}`)
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
      localStorage.removeItem(`delivery_otp_${selectedStorage.customer.phone}`)
      setTimeout(() => setCurrentStep(4), 1000)
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

  const processDelivery = async () => {
    if (!selectedStorage) return
    
    setDeliveryProcessing(true)
    setError("")
    
    try {
      const response = await fetch("/api/storage/deliver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storageId: selectedStorage.id,
          deliveryNotes,
          receiverName,
          receiverRelation,
          digitalSignature
        }),
      })

      if (response.ok) {
        setSuccess(true)
        // Reset after successful delivery
        setTimeout(() => {
          router.push("/dashboard/storage")
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to process delivery")
      }
    } catch (error) {
      setError("An error occurred while processing delivery")
    } finally {
      setDeliveryProcessing(false)
    }
  }

  const handleStorageSelect = (storage: Storage) => {
    setSelectedStorage(storage)
    checkPendingDues(storage.id)
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
              <Label className="text-base font-medium">Select Storage for Delivery</Label>
              <p className="text-sm text-slate-600 mt-1">Choose the storage record to deliver</p>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {storages.map((storage) => (
                <Card 
                  key={storage.id} 
                  className={`cursor-pointer transition-all ${
                    selectedStorage?.id === storage.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleStorageSelect(storage)}
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
                <Truck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No active storage records found for delivery</p>
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
              <CreditCard className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Check Pending Dues</h3>
              <p className="text-slate-600">
                Verify all payments are cleared before delivery
              </p>
            </div>
            
            {pendingDues ? (
              <div className="space-y-4">
                {pendingDues.hasPendingDues ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Pending Dues Found</p>
                        <p>Total outstanding amount: ₹{pendingDues.totalDue}</p>
                        {pendingDues.overduePayments.length > 0 && (
                          <div>
                            <p className="text-sm">Overdue payments:</p>
                            <ul className="text-sm list-disc list-inside">
                              {pendingDues.overduePayments.map((payment) => (
                                <li key={payment.id}>
                                  ₹{payment.amount} (Due: {new Date(payment.dueDate).toLocaleDateString()})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-sm mt-2">Please clear all pending dues before proceeding with delivery.</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-1">
                        <p className="font-medium">No Pending Dues</p>
                        <p className="text-sm">All payments have been cleared. You can proceed with delivery.</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Payment Summary</h4>
                  <div className="space-y-2">
                    {selectedStorage?.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center text-sm">
                        <span>{payment.method} - {new Date(payment.paymentDate).toLocaleDateString()}</span>
                        <span className="font-medium">₹{payment.amount}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between items-center font-medium">
                      <span>Total Paid:</span>
                      <span>₹{selectedStorage?.payments.reduce((sum, payment) => sum + payment.amount, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <p className="text-slate-600 mt-2">Checking pending dues...</p>
              </div>
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

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <FileSignature className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Digital Handover</h3>
              <p className="text-slate-600">
                Complete the digital handover process
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="receiverName">Receiver Name</Label>
                <Input
                  id="receiverName"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  placeholder="Name of person receiving the ash pots"
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label htmlFor="receiverRelation">Relation to Customer</Label>
                <Select value={receiverRelation} onValueChange={setReceiverRelation}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self (Customer)</SelectItem>
                    <SelectItem value="family">Family Member</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="relative">Relative</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
                <Textarea
                  id="deliveryNotes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Any additional notes about the delivery"
                  className="mt-2"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="digitalSignature">Digital Signature</Label>
                <div className="mt-2 p-4 border-2 border-dashed border-slate-300 rounded-lg text-center">
                  <FileSignature className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    Digital signature will be captured here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    (In production, this would integrate with a signature pad)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 5:
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
                <h3 className="text-xl font-medium text-green-900 mb-2">Delivery Successful!</h3>
                <p className="text-green-700 mb-6">
                  Ash pots have been successfully delivered to {receiverName}.
                  Redirecting to storage dashboard...
                </p>
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Delivery Confirmation</CardTitle>
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
                      <div>
                        <p className="text-sm text-slate-600">Receiver</p>
                        <p className="font-medium">{receiverName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Relation</p>
                        <p className="font-medium">{receiverRelation}</p>
                      </div>
                    </div>
                    
                    {deliveryNotes && (
                      <div>
                        <p className="text-sm text-slate-600">Notes</p>
                        <p className="text-sm">{deliveryNotes}</p>
                      </div>
                    )}
                    
                    <div className="border-t pt-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">Ready for Delivery</span>
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
                    onClick={processDelivery} 
                    disabled={deliveryProcessing || !receiverName || !receiverRelation}
                    className="px-8"
                  >
                    {deliveryProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Delivery...
                      </>
                    ) : (
                      "Confirm Delivery"
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
        return pendingDues && !pendingDues.hasPendingDues
      case 3:
        return otpVerified
      case 4:
        return receiverName && receiverRelation
      case 5:
        return true
      default:
        return false
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 2) {
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
              <span className="text-xl font-bold text-slate-900">Ash Pot Delivery</span>
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