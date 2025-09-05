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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Building, 
  Plus, 
  MapPin, 
  Phone,
  Users,
  Edit,
  Trash2,
  Loader2
} from "lucide-react"
import { locationService, userService } from "@/lib/firebase-service"

interface Location {
  id: string
  name: string
  address: string
  contactNumber: string
  createdAt: Date
  operator?: {
    id: string
    name: string
    email: string
  }
}

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  assignedLocationId?: string
}

export default function LocationsManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [operators, setOperators] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    
    fetchLocations()
    fetchOperators()
  }, [session, status, router])

  const fetchLocations = async () => {
    try {
      const locationsData = await locationService.getAll()
      setLocations(locationsData)
    } catch (error) {
      setError("An error occurred while fetching locations")
    } finally {
      setLoading(false)
    }
  }

  const fetchOperators = async () => {
    try {
      const operatorsData = await userService.getAll({ role: "OPERATOR", isActive: true })
      setOperators(operatorsData)
    } catch (error) {
      console.error("Failed to fetch operators:", error)
    }
  }

  const handleCreateLocation = async (formData: FormData) => {
    setCreating(true)
    setError("")

    try {
      const locationData = {
        name: formData.get("name"),
        address: formData.get("address"),
        contactNumber: formData.get("contactNumber")
      }

      await locationService.create(locationData)
      
      setShowCreateDialog(false)
      fetchLocations()
    } catch (error) {
      setError("An error occurred while creating location")
    } finally {
      setCreating(false)
    }
  }

  const handleAssignOperator = async (locationId: string, operatorId: string) => {
    try {
      await userService.update(operatorId, { assignedLocationId: locationId })
      await locationService.update(locationId, { operatorId })
      fetchLocations()
      fetchOperators()
    } catch (error) {
      console.error("Error assigning operator:", error)
    }
  }

  const handleRemoveOperator = async (locationId: string, operatorId: string) => {
    try {
      await userService.update(operatorId, { assignedLocationId: undefined })
      await locationService.update(locationId, { operatorId: undefined })
      fetchLocations()
      fetchOperators()
    } catch (error) {
      console.error("Error removing operator:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading locations...</p>
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
              <span className="text-xl font-bold text-slate-900">Location Management</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Location</DialogTitle>
                    <DialogDescription>
                      Add a new storage location to the system
                    </DialogDescription>
                  </DialogHeader>
                  <form action={handleCreateLocation} className="space-y-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Location Name</Label>
                      <Input id="name" name="name" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" name="address" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactNumber">Contact Number</Label>
                      <Input id="contactNumber" name="contactNumber" type="tel" required />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={creating}>
                        {creating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Create Location"
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
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{locations.length}</div>
                <p className="text-xs text-muted-foreground">Active locations</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned Operators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locations.filter(loc => loc.operator).length}
                </div>
                <p className="text-xs text-muted-foreground">Locations with operators</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Operators</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {operators.filter(op => !op.assignedLocationId).length}
                </div>
                <p className="text-xs text-muted-foreground">Ready for assignment</p>
              </CardContent>
            </Card>
          </div>

          {/* Locations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{location.name}</CardTitle>
                    <Badge variant={location.operator ? "default" : "secondary"}>
                      {location.operator ? "Assigned" : "Available"}
                    </Badge>
                  </div>
                  <CardDescription>{location.address}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{location.contactNumber}</span>
                    </div>
                    
                    {location.operator ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              {location.operator.name}
                            </p>
                            <p className="text-xs text-blue-700">
                              {location.operator.email}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveOperator(location.id, location.operator!.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Assign Operator</Label>
                        <Select onValueChange={(value) => handleAssignOperator(location.id, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {operators
                              .filter(op => !op.assignedLocationId)
                              .map((operator) => (
                                <SelectItem key={operator.id} value={operator.id}>
                                  {operator.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Created:</span>
                      <span className="font-medium">
                        {new Date(location.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {locations.length === 0 && (
            <div className="text-center py-12">
              <Building className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No locations found</h3>
              <p className="text-slate-600">Create your first location to get started</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}