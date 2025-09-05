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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Plus, 
  Users, 
  Building,
  Phone,
  MapPin,
  IndianRupee,
  Shield,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react"
import { locationService, customerService, storageService, userService } from "@/lib/firebase-service"
import { createOTP, verifyOTP } from "@/lib/otp-service"

interface Location {
  id: string
  name: string
  address: string
  contactNumber: string
}

interface Customer {
  id: string
  name: string
  phone: string
  address: string
  operatorId: string
  locationId: string
}

export default function CustomerEntryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showEntryDialog, setShowEntryDialog] = useState(false)
  const [showOTPDialog, setShowOTPDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    numberOfPots: "",
    locationId: "",
    paymentMethod: "CASH" as "CASH" | "UPI" | "QR"
  })
  
  const [otpData, setOtpData] = useState({
    phone: "",
    otp: "",
    purpose: "CUSTOMER_VERIFICATION" as const
  })

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user.role !== "OPERATOR") {
      router.push("/dashboard")
      return
    }
    
    fetchLocations()
  }, [session, status, router])

  const fetchLocations = async () => {
    try {
      // For operators, only show their assigned location
      if (session?.user?.assignedLocationId) {
        const location = await locationService.getById(session.user.assignedLocationId)
        if (location) {
          setLocations([location])
          setFormData(prev => ({ ...prev, locationId: location.id }))
        }
      } else {
        // For admins, show all locations
        const locationsData = await locationService.getAll()
        setLocations(locationsData)
      }
    } catch (error) {
      setError("An error occurred while fetching locations")
    } finally {
      setLoading(false)
    }
  }

  const handleSendOTP = async () => {
    if (!formData.customerPhone) {
      setError("Customer phone number is required")
      return
    }

    setProcessing(true)
    setError("")

    try {
      const otp = await createOTP(formData.customerPhone, "CUSTOMER_VERIFICATION")
      setOtpData({
        phone: formData.customerPhone,
        otp: "",
        purpose: "CUSTOMER_VERIFICATION"
      })
      setShowOTPDialog(true)
      setSuccess(`OTP sent to ${formData.customerPhone}`)
    } catch (error) {
      setError("Failed to send OTP")
    } finally {
      setProcessing(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpData.otp) {
      setError("OTP is required")
      return
    }

    setProcessing(true)
    setError("")

    try {
      const isValid = await verifyOTP(otpData.phone, otpData.otp, otpData.purpose)
      
      if (isValid) {
        setShowOTPDialog(false)
        await processCustomerEntry()
      } else {
        setError("Invalid OTP")
      }
    } catch (error) {
      setError("OTP verification failed")
    } finally {
      setProcessing(false)
    }
  }

  const processCustomerEntry = async () => {
    try {
      // Check if customer already exists
      let customer = await customerService.getByPhone(formData.customerPhone)
      
      if (!customer) {
        // Create new customer
        customer = await customerService.create({
          name: formData.customerName,
          phone: formData.customerPhone,
          address: formData.customerAddress,
          operatorId: session!.user.id,
          locationId: formData.locationId
        })
      }

      // Create storage entry
      const registrationDate = new Date()
      const expiryDate = new Date(registrationDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now

      const storage = await storageService.create({
        customerId: customer.id,
        numberOfPots: parseInt(formData.numberOfPots),
        registrationDate,
        expiryDate,
        status: "ACTIVE",
        operatorId: session!.user.id,
        locationId: formData.locationId
      })

      // Create payment record
      // Note: In a real implementation, you would add payment records here

      setSuccess("Customer entry created successfully!")
      setShowEntryDialog(false)
      
      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        numberOfPots: "",
        locationId: formData.locationId || "",
        paymentMethod: "CASH"
      })
    } catch (error) {
      setError("Failed to create customer entry")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    
    // Validate form
    if (!formData.customerName || !formData.customerPhone || !formData.customerAddress || !formData.numberOfPots || !formData.locationId) {
      setError("All fields are required")
      return
    }

    if (parseInt(formData.numberOfPots) <= 0) {
      setError("Number of pots must be greater than 0")
      return
    }

    // Send OTP for verification
    handleSendOTP()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Customer Entry</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    New Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>New Customer Entry</DialogTitle>
                    <DialogDescription>
                      Register a new customer for ash pot storage
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {success && (
                      <Alert className="border-green-200 bg-green-50">
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone">Phone Number</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="customerAddress">Address</Label>
                      <Input
                        id="customerAddress"
                        value={formData.customerAddress}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="numberOfPots">Number of Ash Pots</Label>
                      <Input
                        id="numberOfPots"
                        type="number"
                        min="1"
                        value={formData.numberOfPots}
                        onChange={(e) => setFormData(prev => ({ ...prev, numberOfPots: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="locationId">Location</Label>
                      <Select value={formData.locationId} onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Payment Method</Label>
                      <Select value={formData.paymentMethod} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="QR">QR Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">Initial Payment</p>
                          <p className="text-xs text-blue-700">₹500 for any number of pots</p>
                        </div>
                        <div className="text-lg font-bold text-blue-900">₹500</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowEntryDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={processing}>
                        {processing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Create Entry"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Entries</CardTitle>
                <Plus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">New registrations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Storage</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">At your location</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹6,000</div>
                <p className="text-xs text-muted-foreground">From new entries</p>
              </CardContent>
            </Card>
          </div>

          {/* Entry Instructions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Entry Process</span>
              </CardTitle>
              <CardDescription>
                Follow these steps to register a new customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium">1. Customer Details</p>
                  <p className="text-xs text-slate-600">Collect customer information</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Phone className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="text-sm font-medium">2. Send OTP</p>
                  <p className="text-xs text-slate-600">Verify customer phone</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <IndianRupee className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium">3. Collect Payment</p>
                  <p className="text-xs text-slate-600">₹500 initial payment</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-medium">4. Complete Entry</p>
                  <p className="text-xs text-slate-600">Generate receipt</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
              <CardDescription>Latest customer registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Customer {item}</p>
                        <p className="text-sm text-slate-600">3 ash pots • 2 hours ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">Active</Badge>
                      <p className="text-xs text-slate-600 mt-1">₹500 paid</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onOpenChange={setShowOTPDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Verify OTP</span>
            </DialogTitle>
            <DialogDescription>
              Enter the 4-digit OTP sent to {otpData.phone}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                maxLength={4}
                value={otpData.otp}
                onChange={(e) => setOtpData(prev => ({ ...prev, otp: e.target.value }))}
                placeholder="0000"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={() => setShowOTPDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleVerifyOTP} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}