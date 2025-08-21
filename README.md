# MONEV Dashboard - CeLOE Monitoring System

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC)](https://tailwindcss.com/)

Sistem monitoring dan evaluasi untuk platform CeLOE Telkom University. Dashboard ini menyediakan analisis real-time performa pembelajaran dan aktivitas mahasiswa dengan fitur admin untuk sinkronisasi data sistem.

## 🚀 Fitur Utama

- **Course Performance**: Monitor performa mata kuliah dan aktivitas mahasiswa
- **Student Activities Summary**: Ringkasan aktivitas mahasiswa dengan filtering dan visualisasi
- **Admin Dashboard**: Kelola sinkronisasi data sistem (ETL)
- **Token Generator**: Generate JWT tokens untuk user access
- **Authentication System**: Sistem login dengan role-based access control
- **Real-time Charts**: Visualisasi data menggunakan Recharts
- **Responsive Design**: Optimized untuk desktop dan mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Charts**: Recharts
- **Forms**: React Hook Form dengan Zod validation
- **Authentication**: JWT-based auth system
- **State Management**: React Context API
- **UI Components**: Custom component library dengan shadcn/ui

## 📋 Prerequisites

Sebelum menjalankan project ini, pastikan sistem Anda memiliki:

- **Node.js** versi 18.17 atau lebih tinggi
- **npm**, **yarn**, atau **pnpm** package manager
- **Git** untuk version control

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd telkom-admin-dashboard
```

### 2. Install Dependencies

```bash
# Menggunakan npm
npm install

# Atau menggunakan yarn
yarn install

# Atau menggunakan pnpm
pnpm install
```

### 3. Environment Setup

Buat file `.env.local` di root directory dan isi dengan konfigurasi berikut:

```env
# Database Configuration
DATABASE_URL="your_database_connection_string"

# JWT Configuration
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="24h"

# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Authentication
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run Development Server

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📁 Project Structure

```
telkom-admin-dashboard/
├── app/                          # Next.js App Router
│   ├── (main)/                  # Main layout dengan sidebar
│   │   ├── admin/               # Admin dashboard pages
│   │   ├── course-performance/  # Course performance page
│   │   ├── student-activities-summary/ # Student activities page
│   │   └── page.tsx            # Home page
│   ├── (no-sidebar)/           # Layout tanpa sidebar
│   │   ├── login/              # Login page
│   │   └── token-generator/    # Token generator page
│   ├── api/                    # API routes
│   └── layout.tsx              # Root layout
├── components/                  # Reusable components
│   ├── ui/                     # UI component library
│   ├── admin/                  # Admin-specific components
│   └── student-activities-summary/ # Feature-specific components
├── lib/                        # Utility libraries
│   ├── api/                    # API client functions
│   ├── auth-context.tsx        # Authentication context
│   └── types.ts                # TypeScript type definitions
├── hooks/                      # Custom React hooks
├── public/                     # Static assets
└── styles/                     # Global styles
```

## 🔐 Authentication

Sistem menggunakan JWT-based authentication dengan role-based access control:

- **User Role**: Akses ke dashboard utama dan fitur monitoring
- **Admin Role**: Akses penuh termasuk admin dashboard dan ETL tools

### Login Flow

1. User mengakses `/login`
2. Input credentials (username/password)
3. Sistem validasi dan generate JWT token
4. Redirect ke dashboard sesuai role

## 📊 Features Detail

### Course Performance
- Monitoring performa mata kuliah
- Analisis aktivitas mahasiswa per course
- Visualisasi data dengan charts

### Student Activities Summary
- Ringkasan aktivitas mahasiswa
- Filtering berdasarkan periode, fakultas, dll
- Distribution charts dan summary tables
- Export data functionality

### Admin Dashboard
- **ETL Tools**: Sinkronisasi data dari berbagai sumber
- **Data Management**: Kelola kategori, subject, dan course data
- **System Monitoring**: Health check dan status sistem

### Token Generator
- Generate JWT tokens untuk user access
- Konfigurasi token expiration
- Role-based token generation

## 🚀 Build & Deploy

### Build Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Environment Variables untuk Production

```env
NODE_ENV=production
DATABASE_URL="production_database_url"
JWT_SECRET="production_jwt_secret"
NEXT_PUBLIC_API_BASE_URL="https://your-domain.com/api"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Style

Project menggunakan:
- **ESLint** untuk code linting
- **Prettier** untuk code formatting
- **TypeScript** untuk type safety
- **Tailwind CSS** untuk styling

### Component Development

Components dibangun menggunakan:
- **Radix UI** untuk accessible primitives
- **shadcn/ui** component library
- **Tailwind CSS** untuk styling
- **TypeScript** untuk type definitions

## 📱 Responsive Design

Dashboard dioptimalkan untuk berbagai ukuran layar:
- **Desktop**: Full sidebar layout dengan semua fitur
- **Tablet**: Collapsible sidebar
- **Mobile**: Mobile-first design dengan hamburger menu

## 🔧 Configuration

### Tailwind CSS
Konfigurasi custom di `tailwind.config.ts` dengan:
- Custom color palette
- Animation utilities
- Component variants

### Next.js
Konfigurasi di `next.config.mjs`:
- Image optimization
- API routes
- Build optimizations

## 🐛 Troubleshooting

### Common Issues

1. **Port 3000 already in use**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Environment variables not loading**
   - Pastikan file `.env.local` ada di root directory
   - Restart development server

3. **Build errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

### Debug Mode

Aktifkan debug mode dengan environment variable:

```env
DEBUG=true
```

## 📄 License

Project ini dikembangkan untuk internal use Telkom University.

## 👥 Contributors

- **Gagas Surya Laksana** - Lead Developer
- **Telkom University Team** - Project Stakeholders

## 📞 Support

Untuk pertanyaan atau support, silakan hubungi:
- **Email**: [your-email@telkomuniversity.ac.id]
- **Documentation**: [link-to-docs]
- **Issue Tracker**: [link-to-issues]

---

**Note**: Pastikan untuk mengupdate environment variables dan konfigurasi sesuai dengan environment development/production Anda.
