"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Building, 
  Users, 
  Search, 
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Truck,
  CreditCard
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
    email?: string
  }
  operator: {
    id: string
    name: string
  }
  location: {
    id: string
    name: string
  }
  payments: Array<{
    id: string
    amount: number
    status: string
    paymentDate: string
    method: string
  }>
}

interface Location {
  id: string
  name: string
  address: string
  capacity: number
  _count: {
    storages: number
  }
}

const statusColors = {
  [StorageStatus.ACTIVE]: "bg-green-100 text-green-800",
  [StorageStatus.EXPIRING]: "bg-yellow-100 text-yellow-800",
  [StorageStatus.EXPIRED]: "bg-red-100 text-red-800",
  [StorageStatus.DELIVERED]: "bg-blue-100 text-blue-800",
}

const statusIcons = {
  [StorageStatus.ACTIVE]: CheckCircle,
  [StorageStatus.EXPIRING]: Clock,
  [StorageStatus.EXPIRED]: XCircle,
  [StorageStatus.DELIVERED]: Truck,
}

export default function StorageDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [storages, setStorages] = useState<Storage[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<StorageStatus | "ALL">("ALL")
  const [locationFilter, setLocationFilter] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<"expiryDate" | "registrationDate" | "customerName">("expiryDate")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.OPERATOR)) {
      router.push("/dashboard")
      return
    }
    
    fetchStorages()
    fetchLocations()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStorages()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [session, status, router])

  const fetchStorages = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "ALL") params.append("status", statusFilter)
      if (locationFilter !== "ALL") params.append("locationId", locationFilter)
      if (sortBy) params.append("sortBy", sortBy)
      
      const response = await fetch(`/api/storage?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStorages(data)
      } else {
        setError("Failed to fetch storage data")
      }
    } catch (error) {
      setError("An error occurred while fetching storage data")
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations")
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStorages()
    setRefreshing(false)
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredStorages = storages.filter(storage => {
    const matchesSearch = storage.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         storage.customer.phone.includes(searchTerm) ||
                         storage.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "ALL" || storage.status === statusFilter
    const matchesLocation = locationFilter === "ALL" || storage.location.id === locationFilter
    
    return matchesSearch && matchesStatus && matchesLocation
  })

  const sortedStorages = [...filteredStorages].sort((a, b) => {
    switch (sortBy) {
      case "expiryDate":
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      case "registrationDate":
        return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
      case "customerName":
        return a.customer.name.localeCompare(b.customer.name)
      default:
        return 0
    }
  })

  const getStatusBadge = (storage: Storage) => {
    const daysUntilExpiry = getDaysUntilExpiry(storage.expiryDate)
    const StatusIcon = statusIcons[storage.status]
    
    let statusText = storage.status
    if (storage.status === StorageStatus.ACTIVE && daysUntilExpiry <= 7) {
      statusText = `Expiring in ${daysUntilExpiry} days`
    }
    
    return (
      <Badge className={statusColors[storage.status]}>
        <StatusIcon className="w-3 h-3 mr-1" />
        {statusText}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading storage data...</p>
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
                <Building className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Storage Management</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => router.push("/dashboard/entry")}>
                <Plus className="w-4 h-4 mr-2" />
                New Entry
              </Button>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storages.length}</div>
                <p className="text-xs text-muted-foreground">Across all locations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {storages.filter(s => s.status === StorageStatus.ACTIVE).length}
                </div>
                <p className="text-xs text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {storages.filter(s => {
                    const days = getDaysUntilExpiry(s.expiryDate)
                    return s.status === StorageStatus.ACTIVE && days <= 7
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Within 7 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {storages.filter(s => s.status === StorageStatus.EXPIRED).length}
                </div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by customer name, phone, or storage ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StorageStatus | "ALL")}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value={StorageStatus.ACTIVE}>Active</SelectItem>
                <SelectItem value={StorageStatus.EXPIRING}>Expiring</SelectItem>
                <SelectItem value={StorageStatus.EXPIRED}>Expired</SelectItem>
                <SelectItem value={StorageStatus.DELIVERED}>Delivered</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as "expiryDate" | "registrationDate" | "customerName")}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiryDate">Expiry Date</SelectItem>
                <SelectItem value="registrationDate">Registration Date</SelectItem>
                <SelectItem value="customerName">Customer Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Storage Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedStorages.map((storage) => (
              <Card key={storage.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{storage.customer.name}</CardTitle>
                    {getStatusBadge(storage)}
                  </div>
                  <CardDescription>
                    <div className="flex items-center space-x-2 text-sm">
                      <span>{storage.customer.phone}</span>
                      {storage.customer.email && (
                        <span>• {storage.customer.email}</span>
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Location:</span>
                      <Badge variant="outline">{storage.location.name}</Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Ash Pots:</span>
                      <span className="font-medium">{storage.numberOfPots}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Registered:</span>
                      <span className="text-sm">
                        {new Date(storage.registrationDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Expires:</span>
                      <span className="text-sm font-medium">
                        {new Date(storage.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Operator:</span>
                      <span className="text-sm">{storage.operator.name}</span>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Total Paid:</span>
                        <span className="font-medium">
                          ₹{storage.payments.reduce((sum, payment) => sum + payment.amount, 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {storage.status === StorageStatus.ACTIVE && (
                        <Button variant="outline" size="sm">
                          <CreditCard className="w-4 h-4 mr-1" />
                          Renew
                        </Button>
                      )}
                      {storage.status !== StorageStatus.DELIVERED && (
                        <Button variant="outline" size="sm">
                          <Truck className="w-4 h-4 mr-1" />
                          Deliver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {sortedStorages.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No storage records found</h3>
              <p className="text-slate-600">Try adjusting your search or filters</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}