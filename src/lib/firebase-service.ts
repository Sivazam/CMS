import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from "firebase/firestore"
import { db } from "./firebase"
import { User, Location, Customer, Storage, Payment, Notification, OTP } from "./firebase-types"

// Convert Firestore timestamp to Date
const toDate = (timestamp: any): Date => {
  return timestamp?.toDate() || new Date()
}

// Convert Date to Firestore timestamp
const toTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date)
}

// User Services
export const userService = {
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      console.log("Creating user in Firestore with data:", userData)
      const docRef = await addDoc(collection(db, 'users'), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      
      console.log("User document created with ID:", docRef.id)
      
      const docSnap = await getDoc(docRef)
      const data = docSnap.data()
      console.log("Retrieved user data:", data)
      
      return {
        id: docSnap.id,
        ...data,
        createdAt: toDate(data?.createdAt),
        updatedAt: toDate(data?.updatedAt)
      } as User
    } catch (error) {
      console.error("Error creating user in Firestore:", error)
      throw error
    }
  },

  async getById(id: string): Promise<User | null> {
    const docRef = doc(db, 'users', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: toDate(docSnap.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    } as User
  },

  async getByEmail(email: string): Promise<User | null> {
    try {
      console.log("Looking up user by email:", email)
      const q = query(collection(db, 'users'), where('email', '==', email))
      const querySnapshot = await getDocs(q)
      
      console.log("Query completed, found", querySnapshot.size, "documents")
      
      if (querySnapshot.empty) {
        console.log("No user found with email:", email)
        return null
      }
      
      const doc = querySnapshot.docs[0]
      const data = doc.data()
      console.log("User data found:", data)
      
      return {
        id: doc.id,
        ...data,
        createdAt: toDate(data?.createdAt),
        updatedAt: toDate(data?.updatedAt)
      } as User
    } catch (error) {
      console.error("Error getting user by email:", error)
      throw error
    }
  },

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const docRef = doc(db, 'users', id)
    await updateDoc(docRef, {
      ...userData,
      updatedAt: serverTimestamp()
    })
    
    return await this.getById(id)
  },

  async getAll(filters?: { role?: string; isActive?: boolean }): Promise<User[]> {
    let q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    
    if (filters?.role) {
      q = query(q, where('role', '==', filters.role))
    }
    
    if (filters?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filters.isActive))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data()?.createdAt),
      updatedAt: toDate(doc.data()?.updatedAt)
    })) as User[]
  }
}

// Location Services
export const locationService = {
  async create(locationData: Omit<Location, 'id' | 'createdAt' | 'updatedAt'>): Promise<Location> {
    const docRef = await addDoc(collection(db, 'locations'), {
      ...locationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: toDate(docSnap.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    } as Location
  },

  async getById(id: string): Promise<Location | null> {
    const docRef = doc(db, 'locations', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: toDate(docSnap.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    } as Location
  },

  async getAll(): Promise<Location[]> {
    const q = query(collection(db, 'locations'), orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    })) as Location[]
  },

  async update(id: string, locationData: Partial<Location>): Promise<Location | null> {
    const docRef = doc(db, 'locations', id)
    await updateDoc(docRef, {
      ...locationData,
      updatedAt: serverTimestamp()
    })
    
    return await this.getById(id)
  }
}

// Customer Services
export const customerService = {
  async create(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: toDate(docSnap.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    } as Customer
  },

  async getById(id: string): Promise<Customer | null> {
    const docRef = doc(db, 'customers', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: toDate(docSnap.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    } as Customer
  },

  async getByPhone(phone: string): Promise<Customer | null> {
    const q = query(collection(db, 'customers'), where('phone', '==', phone))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) return null
    
    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: toDate(doc.data()?.createdAt),
      updatedAt: toDate(doc.data()?.updatedAt)
    } as Customer
  }
}

// Storage Services
export const storageService = {
  async create(storageData: Omit<Storage, 'id' | 'createdAt' | 'updatedAt' | 'payments' | 'notifications'>): Promise<Storage> {
    const docRef = await addDoc(collection(db, 'storages'), {
      ...storageData,
      payments: [],
      notifications: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return {
      id: docSnap.id,
      ...docSnap.data(),
      payments: docSnap.data()?.payments || [],
      notifications: docSnap.data()?.notifications || [],
      createdAt: toDate(docSnap.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    } as Storage
  },

  async getById(id: string): Promise<Storage | null> {
    const docRef = doc(db, 'storages', id)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return null
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      payments: docSnap.data()?.payments || [],
      notifications: docSnap.data()?.notifications || [],
      createdAt: toDate(docSnap.data()?.createdAt),
      updatedAt: toDate(docSnap.data()?.updatedAt)
    } as Storage
  },

  async getByCustomerId(customerId: string): Promise<Storage[]> {
    const q = query(collection(db, 'storages'), where('customerId', '==', customerId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      payments: doc.data()?.payments || [],
      notifications: docSnap.data()?.notifications || [],
      createdAt: toDate(doc.data()?.createdAt),
      updatedAt: toDate(doc.data()?.updatedAt)
    })) as Storage[]
  },

  async update(id: string, storageData: Partial<Storage>): Promise<Storage | null> {
    const docRef = doc(db, 'storages', id)
    await updateDoc(docRef, {
      ...storageData,
      updatedAt: serverTimestamp()
    })
    
    return await this.getById(id)
  }
}

// OTP Services
export const otpService = {
  async create(otpData: Omit<OTP, 'id' | 'createdAt'>): Promise<OTP> {
    const docRef = await addDoc(collection(db, 'otps'), {
      ...otpData,
      createdAt: serverTimestamp()
    })
    
    const docSnap = await getDoc(docRef)
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: toDate(docSnap.data()?.createdAt)
    } as OTP
  },

  async verify(phone: string, code: string, purpose: string): Promise<boolean> {
    const q = query(
      collection(db, 'otps'), 
      where('phone', '==', phone),
      where('code', '==', code),
      where('purpose', '==', purpose),
      where('isUsed', '==', false)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) return false
    
    const otp = querySnapshot.docs[0]
    const otpData = otp.data() as OTP
    
    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      return false
    }
    
    // Mark OTP as used
    await updateDoc(otp.ref, { isUsed: true })
    
    return true
  }
}