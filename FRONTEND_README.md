# Gaza Logistics Frontend

A modern, multi-tenant web application for managing humanitarian logistics operations in Gaza, built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Multi-Tenant Architecture**: Complete organizational isolation
- **Role-Based Access Control**: 5 distinct user roles with granular permissions
- **Real-Time Dashboard**: Live operational metrics and fleet status
- **Driver Management**: Registration, approval, and assignment workflows
- **Fleet Management**: Vehicle tracking and status monitoring
- **Mission Planning**: Complete Gaza logistics workflow management
- **Mobile-First Design**: Responsive UI optimized for mobile devices
- **Modern UI**: Clean, professional design using shadcn/ui components

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Authentication**: JWT-based with secure token management
- **API Integration**: RESTful API client with TypeScript

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn
- Gaza Logistics Backend API running on port 8080

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and configure:
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── drivers/           # Driver management
│   ├── fleet/             # Fleet management
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── drivers/           # Driver management components
│   ├── ui/                # shadcn/ui components
│   ├── dashboard.tsx      # Main dashboard component
│   └── main-layout.tsx    # Authenticated app layout
├── context/               # React context providers
│   └── auth-context.tsx   # Authentication state management
├── lib/                   # Utility libraries
│   ├── api-client.ts      # Backend API client
│   └── utils.ts           # Shared utilities
└── types/                 # TypeScript type definitions
    └── index.ts           # Application types
```

## User Roles & Permissions

### 1. Dispatcher
- Create and manage drivers
- Register and dispatch trucks
- Track mission progress
- View operational statistics

### 2. Operations Manager
- Full system access
- Approve/deny drivers
- Override dispatch decisions
- Manage users and settings
- Close missions

### 3. Contractor Focal Point
- Manage own contractor's drivers
- View assigned trucks and missions
- Upload driver lists

### 4. Maintenance
- Update truck maintenance status
- Add maintenance notes and costs
- View fleet status

### 5. Finance & Audit
- Read-only access to all data
- Generate reports
- Review reconciled missions
- Audit trail access

## Key Features

### Dashboard
- Real-time operational metrics
- Fleet status breakdown
- Quick action buttons
- Role-based view filtering

### Driver Management
- Registration and approval workflow
- Bulk CSV import capability
- Status tracking (Pending/Approved/Denied)
- Contractor assignment

### Fleet Management
- Vehicle registration and tracking
- Real-time status updates
- Driver assignment
- Maintenance scheduling

### Multi-Tenant Security
- Complete data isolation between organizations
- Role-based access control
- Secure JWT authentication
- Audit logging

## Gaza Logistics Workflow

The application models the complete humanitarian logistics workflow:

1. **Driver Registration** → **Approval** → **Assignment**
2. **Fleet Registration** → **Inspection** → **Dispatch**
3. **Mission Planning** → **Resource Allocation** → **Execution**
4. **Fuel Station** → **HP1 Gate** → **HP2 Gate** → **Loading** → **Delivery**

## Backend Integration

The frontend integrates with the Gaza Logistics Backend API running on port 8080:

- **Authentication**: `/api/users/login`, `/api/users/register`
- **Drivers**: `/api/gaza/drivers/*`
- **Fleet**: `/api/gaza/trucks/*`
- **Contractors**: `/api/gaza/contractors/*`
- **Missions**: `/api/gaza/missions/*`

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Automatic formatting with Prettier
- Component-based architecture
- Responsive design patterns

## Deployment

The application is optimized for deployment on Vercel, Netlify, or any Node.js hosting platform.

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Deploy to your preferred platform

## Support

For technical support or questions about the Gaza Logistics system, please refer to the backend documentation or contact the development team.

## Security

- JWT token-based authentication
- HTTPS enforcement in production
- Input validation and sanitization
- XSS and CSRF protection
- Secure headers with Helmet.js