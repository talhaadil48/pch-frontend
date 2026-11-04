# PCH Hire Portal - Frontend Application

Next.js 15 App Router web application for the PCH Hire Management Portal.

## Features
- **Next.js 15 & React 19** with Tailwind CSS and Lucide React icons.
- **PCH Brand Identity**: Styled with official PCH Red (`#D71920`), Charcoal (`#151515`), and crisp borders.
- **Credit Hire Forms Suite**:
  - Hire Agreement (Rental Agreement with vehicle swap history and 5 signatures)
  - RTA Accident Claim (interactive road sketch canvas, circumstances, witness log)
  - Pre-Inspection Form (30-point condition matrix & stamped damage diagram)
  - Storage & Recovery Agreement
  - Cancellation Notice (statutory 14-day notice)
  - S3 Document Manager with custom file naming and categorization
- **Instant Client-Side PDF Generation**: High-resolution, branded 2-page PDFs via jsPDF.
- **Interactive Signature Modal**: High-DPI canvas with touch smoothing and direct persistence.
- **Live Fleet Management**: View and assign vehicles with automatic status updates.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/talhaadil48/pch-frontend.git
   cd pch-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

4. **Run Development Server:**
   ```bash
   npm run dev -p 3001
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm run start -- -p 3001
   ```
