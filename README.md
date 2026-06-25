<div align="center">
  <img src="app/favicon.ico" alt="InvoiceLens Logo" width="120" />
  
  # 👁️ InvoiceLens
  **Your Personal AI Financial Assistant & Smart Invoice Scanner**

  [![Next.js](https://img.shields.io/badge/Built_with-Next.js_14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Gemini AI](https://img.shields.io/badge/Powered_by-Gemini_AI-blue?style=for-the-badge&logo=google)](https://ai.google.dev/)
  [![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#license)
</div>

---

## ✨ Overview

**InvoiceLens** is not just an invoice scanner—it's a complete financial ecosystem powered by cutting-edge Artificial Intelligence. Designed to eliminate the tedious hours of manual data entry, InvoiceLens uses advanced optical character recognition (OCR) and Google's Gemini AI to instantly extract, categorize, and analyze your physical and digital receipts.

Whether you're tracking personal expenses or managing a small business, InvoiceLens gives you crystal-clear insights into where your money is going.

## 🚀 Key Features

- **🤖 Smart OCR Scanning:** Instantly extract vendor names, totals, dates, and line items from any uploaded invoice or receipt.
- **💬 Financial AI Assistant:** Chat directly with your data! Ask our Gemini-powered bot questions like *"How much did I spend at Amazon last month?"* and get instant, context-aware answers.
- **⚖️ Round-Robin Load Balancing:** Built-in enterprise-grade API key rotation ensures the AI assistant never goes down due to rate limits or high-demand spikes.
- **🌍 Full Internationalization (i18n):** Natively supports 8 languages (English, Indonesian, Spanish, Portuguese, Chinese, Russian, Arabic, and German) with automatic RTL layout switching.
- **🎨 Deep Customization:** Fully personalize your dashboard with custom profile avatars, nicknames, and dynamic backgrounds.
- **📊 Comprehensive Analytics:** Track your spending trends, top vendors, and average invoice values at a glance.
- **🔒 Secure Authentication:** Handled seamlessly and securely via NextAuth and Google OAuth.

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI Integration:** [Vercel AI SDK](https://sdk.vercel.ai/) & [Google Gemini](https://ai.google.dev/)
- **Database:** PostgreSQL (via [Supabase](https://supabase.com/))
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Styling:** Custom CSS with dynamic CSS Variables for rich theming

## ⚙️ Local Development

Want to run InvoiceLens locally? It's incredibly simple to set up.

### Prerequisites
- Node.js 18+
- A PostgreSQL Database (Supabase recommended)
- A Google Cloud Console project (for OAuth)
- One or more Gemini API Keys

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Haxiuz/InvoiceLens.git
   cd InvoiceLens
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and configure the following:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/db"
   DIRECT_URL="postgresql://user:password@host:port/db"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-strong-secret-key"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Gemini AI
   # You can provide a single key, or a comma-separated list for automatic load-balancing!
   GEMINI_API_KEYS="key1,key2,key3"
   ```

4. **Initialize the Database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🛡️ License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<div align="center">
  <i>Built with ❤️ by Haxiuz & Antigravity</i>
</div>
