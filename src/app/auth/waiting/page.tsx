"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Clock, User, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

export default function WaitingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [checkingStatus, setCheckingStatus] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/auth/signin")
      return
    }

    // Check if user is approved
    const checkApproval = async () => {
      try {
        const response = await fetch(`/api/users/${session.user.id}`)
        if (response.ok) {
          const user = await response.json()
          if (user.isActive) {
            router.push("/dashboard")
          }
        }
      } catch (error) {
        console.error("Error checking approval status:", error)
      } finally {
        setCheckingStatus(false)
      }
    }

    checkApproval()

    // Poll every 30 seconds to check approval status
    const interval = setInterval(checkApproval, 30000)
    return () => clearInterval(interval)
  }, [session, status, router])

  const handleSignOut = () => {
    signOut()
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Checking approval status...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">SCM System</span>
          </div>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Account Pending Approval</CardTitle>
            <CardDescription>
              Your operator account is waiting for admin approval
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-600">
                Hello <span className="font-semibold">{session?.user?.name}</span>,
              </p>
              <p className="text-sm text-slate-600">
                Your account has been registered but requires admin approval before you can access the system.
              </p>
              <p className="text-sm text-slate-600">
                Please wait for an administrator to review and approve your account.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">What happens next?</p>
                  <ul className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>• Admin will review your registration</li>
                    <li>• You'll receive approval via email/SMS</li>
                    <li>• This page will automatically redirect once approved</li>
                    <li>• This status is checked every 30 seconds</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Check Status Now
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="ghost"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            © 2024 SCM System. Built for Rotary Charitable Trust.
          </p>
        </div>
      </motion.div>
    </div>
  )
}