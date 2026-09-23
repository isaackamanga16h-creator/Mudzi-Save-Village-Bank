Markdown
# 🌾 MudziSave — Digital Village Savings & Loans Association (VSLA) Platform

> **MudziSave** is a modern, lightweight web application designed to digitize community-based Village Savings and Loan Associations (VSLAs) and *Banki Mkhonde* groups in Malawi. It streamlines financial management, tracking group contributions, loan applications, repayments, and member profiles seamlessly.

---

## 🚀 Features

* **🔐 Authentication & Access Control:** Secure user registration, login, and JWT Bearer token handling.
* **👥 Group Management:** Register and manage community savings groups with local administrative tracking.
* **👨‍👩‍👧‍👦 Member Profiles:** Add group members, track individual profiles, and view modal summaries.
* **💰 Savings Tracker:** Record, monitor, and audit periodic member deposits and total savings.
* **📄 Loan Management:** Handle loan requests, approval tracking, and interest calculations.
* **🔄 Repayments Engine:** Record partial or full loan repayments with real-time balance updates.
* **📊 Visual Dashboard:** Summary statistics for quick insights into total savings, active loans, and group metrics.

---

## 🛠️ Tech Stack

* **Frontend Framework:** React 18 (via [Vite](https://vitejs.dev/))
* **Styling:** Tailwind CSS / Lucide React Icons
* **HTTP Client:** Axios (configured with interceptors for automatic Auth token attachment)
* **Version Control:** Git

---

## 📁 Project Structure

```text
mudzisave-frontend/
├── public/                  # Static assets & favicon
├── src/
│   ├── assets/              # Images and branding files
│   ├── components/          # Reusable UI components (Navbar, Modals, Cards)
│   ├── pages/               # Views (Dashboard, Groups, Members, Savings, Loans, Repayments)
│   ├── services/            # Axios instance & API integration endpoints
│   ├── App.jsx              # Main App layout & route controller
│   ├── main.jsx             # React DOM entry point
│   └── index.css            # Global CSS & Tailwind directives
├── package.json             # NPM dependencies & scripts
├── vite.config.js           # Vite server configuration
└── README.md                # Project documentation
⚡ Quick Start & Local Setup
Prerequisites
Node.js (v18.x or higher)

npm (v9.x or higher)

Running instance of the MudziSave Backend API

1. Clone the Repository
Bash
git clone [https://github.com/your-username/mudzisave-frontend.git](https://github.com/your-username/mudzisave-frontend.git)
cd mudzisave-frontend
2. Install Dependencies
Bash
npm install
3. Environment Setup
Create a .env file in the root directory and define your backend API base URL:

Code snippet
VITE_API_BASE_URL=http://localhost:5000/api
4. Run Development Server
Bash
npm run dev
Open your browser and navigate to http://localhost:5173.

🧪 Production Build
To create an optimized production build:

Bash
npm run build
To preview the production build locally:

Bash
npm run preview
🤝 Contributing
Fork the repository.

Create a feature branch: git checkout -b feature/new-feature

Commit your changes: git commit -m "Add new feature"

Push to the branch: git push origin feature/new-feature

Open a Pull Request.

📄 License
Distributed under the MIT License. See LICENSE for more information