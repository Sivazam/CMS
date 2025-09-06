# 🏛️ Smart Cremation Management System (SCM)

A comprehensive ash pot storage and management system built for Rotary Charitable Trust, featuring role-based access control, automated renewals, and real-time monitoring capabilities.

## 🎯 Project Overview

This application is designed to streamline the management of ash pot storage facilities with a complete workflow from customer registration to renewal and delivery. The system supports multiple user roles with specific responsibilities and integrates SMS notifications for automated communication.

## 👥 User Roles & Capabilities

### 🔑 Admin Role
- **Signup**: Requires special admin key "1376" for registration
- **Dashboard**: Complete system overview with statistics and analytics
- **User Management**: View, approve, or deny operator registration requests
- **Location Management**: Add, edit, and manage storage locations
- **Operator Assignment**: Assign operators to specific locations
- **System Monitoring**: Monitor statistics across all locations
- **Approvals**: Set operator accounts to active/inactive status

### 👨‍💼 Operator Role
- **Signup**: Self-registration with admin approval required
- **Customer Management**: Add new customers with ash pot storage
- **OTP Verification**: Send OTP to customers during payment process
- **Payment Processing**: Handle ₹500 initial payments (UPI, Cash, QR)
- **Location-Specific**: Access limited to assigned location only
- **Entry Management**: Create and manage customer storage entries
- **Renewals**: Handle customer renewal processes

### 👥 Customers (No Signup Required)
- **Managed by Operators**: All customer data is entered by operators
- **Receive Notifications**: Get SMS alerts for renewals and deliveries
- **Payment Processing**: Make payments through operators with OTP verification
- **Storage Tracking**: Operators manage their storage entries
- **Delivery Requests**: Coordinated through operators

## 🚀 Key Features

### 🔐 Authentication & Authorization
- Role-based access control (Admin, Operator, Customer)
- Secure signup with admin key validation
- Firebase authentication integration
- Session management with NextAuth.js

### 📊 Dashboard & Analytics
- Real-time statistics and metrics
- Location-specific data views
- Revenue tracking and reporting
- Customer and storage analytics

### 🏢 Location Management
- Multiple storage location support
- Operator assignment to locations
- Capacity tracking and monitoring
- Location-specific statistics

### 👥 User Management
- Admin approval workflow for operators
- User role management
- Active/inactive status control
- Comprehensive user profiles

### 💳 Payment Processing
- Multiple payment methods (UPI, Cash, QR)
- Initial ₹500 payment for storage
- Payment tracking and records
- Automated payment reminders

### 📱 SMS Integration (Fast2SMS)
- Automated OTP generation and verification
- Registration confirmation messages
- Renewal reminders (2 months, final warnings)
- Delivery confirmation notifications
- Payment success/failure alerts

### 🔔 Notification System
- Automated SMS notifications
- Email notifications (optional)
- In-app notification center
- Customizable message templates

### 📋 Storage Management
- Ash pot registration and tracking
- Expiry date management
- Automated renewal reminders
- Delivery process management
- Storage status tracking

## 🛠️ Technology Stack

### Core Framework
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript 5** - Type-safe JavaScript
- **🎨 Tailwind CSS 4** - Utility-first CSS framework
- **🔥 Firebase** - Authentication and Firestore database

### UI Components
- **🧩 shadcn/ui** - High-quality accessible components
- **🎯 Lucide React** - Beautiful icon library
- **🎭 Framer Motion** - Animation library
- **🌈 Next Themes** - Dark/light mode support

### State Management & Data
- **🐻 Zustand** - Client state management
- **🔄 TanStack Query** - Server state management
- **🗄️ Prisma** - Database ORM (SQLite)
- **📊 Recharts** - Data visualization

### Communication & Services
- **📱 Fast2SMS** - SMS integration for notifications
- **🔐 NextAuth.js** - Authentication solution
- **🔌 Socket.io** - Real-time communication
- **🌐 Axios** - HTTP client

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project setup
- Fast2SMS API key (for SMS functionality)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Sivazam/CMS.git
cd CMS
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env.local` file with the following:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Fast2SMS Configuration
FAST2SMS_API_KEY=your_fast2sms_api_key

# Database Configuration
DATABASE_URL="file:./dev.db"
```

4. **Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

5. **Start Development Server**
```bash
npm run dev
```

6. **Open Application**
Visit [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Application Workflow

### 1. Admin Setup
1. Admin signs up using special key "1376"
2. Admin creates storage locations
3. Admin monitors operator registration requests
4. Admin approves/denies operator accounts
5. Admin assigns operators to locations

### 2. Operator Registration
1. Operator signs up with personal details
2. Request appears in admin dashboard
3. Admin approves operator account
4. Operator can now access the system

### 3. Customer Entry Process (No Customer Signup)
1. Operator collects customer details (name, phone, address)
2. System sends OTP to customer phone
3. Customer provides OTP to operator
4. Operator verifies OTP and processes ₹500 payment
5. System creates storage entry and sends confirmation

### 4. Renewal Process
1. System sends renewal reminders (2 months before expiry)
2. Customer can renew through operator
3. Process repeats with OTP verification
4. System updates expiry date and sends confirmation

### 5. Delivery Process
1. Customer requests delivery
2. Operator initiates delivery process
3. OTP verification for secure handover
4. System updates status and sends confirmation

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions
    ├── auth.ts           # Authentication configuration
    ├── firebase.ts       # Firebase configuration
    ├── firebase-service.ts # Firebase service functions
    ├── sms-service.ts    # SMS service (Fast2SMS)
    └── otp-service.ts    # OTP service functions
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:reset     # Reset database
```

## 🌟 Key Features in Detail

### Admin Dashboard
- System-wide statistics overview
- User management with approval workflow
- Location management and assignment
- Revenue and analytics tracking
- Real-time monitoring capabilities

### Operator Dashboard
- Location-specific statistics
- Customer entry management
- OTP verification system
- Payment processing interface
- Recent activity tracking

**Note**: No customer dashboard exists as customers do not signup or access the system directly.

### SMS Notifications
- **Registration**: Confirmation of storage registration
- **Renewal Reminder**: 2 months before expiry
- **Final Warning**: Last notice before expiry
- **Delivery Confirmation**: Safe collection confirmation
- **Payment Success**: Renewal payment confirmation

## 🛡️ Security Features

- Role-based access control
- OTP verification for critical operations
- Secure password hashing
- Firebase authentication
- Admin key validation
- Session management

## 📈 Monitoring & Analytics

- Real-time dashboard statistics
- Location-specific metrics
- Revenue tracking and reporting
- Customer growth analytics
- Storage utilization metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@scmsystem.com
- Phone: +91 98765 43210
- 24/7 support available for registered users

## 🏢 About

Built for **Rotary Charitable Trust** to provide a comprehensive solution for ash pot storage management. This system ensures secure, efficient, and transparent management of cremation services with modern technology integration.

---

**Developed with ❤️ for Rotary Charitable Trust**
*Transforming traditional cremation management with digital innovation*