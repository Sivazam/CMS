import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      phone?: string
      isActive: boolean
      assignedLocationId?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    phone?: string
    isActive: boolean
    assignedLocationId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    phone?: string
    isActive: boolean
    assignedLocationId?: string
  }
}