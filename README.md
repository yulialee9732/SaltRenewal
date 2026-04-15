# SaltRenewal — Customer & Employee Service Portal

A full-stack MERN web application built for **SaltRenewal**, a Korean-owned home services company. It provides a customer-facing portal for submitting price estimates and service requests, and an internal employee dashboard for managing and tracking those submissions.

---

## What This Project Does

Customers visit the landing page, fill out a price estimate form or service inquiry, and submit it. The submission is saved to MongoDB and optionally synced to a Google Sheets spreadsheet for internal tracking. Employees log in separately to view, manage, and update all incoming submissions in real time.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React** | UI component library |
| **React Router v6** | Client-side routing |
| **Axios** | HTTP requests to the API |
| **Context API** | Global auth state management |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express.js** | REST API server |
| **MongoDB Atlas** | Cloud database |
| **Mongoose** | MongoDB object modeling (ODM) |
| **JWT (jsonwebtoken)** | Authentication tokens |
| **bcryptjs** | Password hashing |
| **nodemailer / Resend** | Email notifications |
| **Google Sheets API** | Real-time spreadsheet sync (optional) |
| **node-cron** | Scheduled background tasks |

### Deployment
| Service | Purpose |
|---|---|
| **Netlify** | Frontend hosting |
| **Render** | Backend API hosting |
| **MongoDB Atlas** | Database hosting |

---

## How It Works

```
User Browser
    │
    ▼
React App (Netlify)
    │  Axios HTTP requests
    ▼
Express REST API (Node.js)
    │              │
    ▼              ▼
MongoDB Atlas   Google Sheets API
(primary DB)    (optional sync)
```

1. **Landing page** — Visitors see service offerings and can request a price estimate
2. **Price estimate form** — Submitted data is saved to MongoDB and synced to Google Sheets
3. **Authentication** — JWT tokens are issued on login; role-based access controls what each user sees
4. **Customer dashboard** — Customers can view their own submissions and track status
5. **Employee dashboard** — Employees see all submissions, can update status, add notes, and manage records

---

## Features

### Customer Portal
- Register and log in with a secure account
- Submit price estimate requests with detailed service options
- View and track the status of their own submissions

### Employee Portal
- Separate employee login with role-based access
- View all customer submissions in one dashboard
- Update status, add internal notes, and manage records
- Edit history tracked with timestamps and editor info
- Real-time notifications for new submissions

### Integrations
- **Google Sheets** — All form submissions optionally synced in real time for non-technical staff
- **Email notifications** — Automated emails via Nodemailer/Resend on new submissions

---

## Getting Started

### Prerequisites
- Node.js v14 or higher
- MongoDB Atlas account (free tier works)
- npm or yarn

### 1. Clone the repository
```bash
git clone git@github.com:yulialee9732/SaltRenewal.git
cd SaltRenewal/mern-app
```

### 2. Set up the server
```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env` with your credentials:
```env
PORT=5001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/mern-app
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

> Tip: Generate a strong JWT secret with `openssl rand -base64 32`

### 3. Set up the client
```bash
cd ../client
npm install
```

### 4. Run in development
```bash
# Terminal 1 — start backend
cd server && npm run dev       # runs on http://localhost:5001

# Terminal 2 — start frontend
cd client && npm start         # runs on http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (Protected)
- `PUT /api/auth/updatedetails` - Update user details (Protected)
- `PUT /api/auth/updatepassword` - Update password (Protected)

### Service Requests
- `GET /api/service-requests` - Get all service requests (Protected, filtered by role)
- `GET /api/service-requests/:id` - Get single service request (Protected)
- `POST /api/service-requests` - Create service request (Customer only)
- `PUT /api/service-requests/:id` - Update service request (Protected)
- `DELETE /api/service-requests/:id` - Delete service request (Employee only)

### Contact Forms
- `GET /api/contact-forms` - Get all contact forms (Protected, filtered by role)
- `GET /api/contact-forms/:id` - Get single contact form (Protected)
- `POST /api/contact-forms` - Create contact form (Customer only)
- `PUT /api/contact-forms/:id` - Update contact form (Employee only)
- `DELETE /api/contact-forms/:id` - Delete contact form (Employee only)

## User Roles

### Customer
- Can create service requests and contact forms
- Can view only their own submissions
- Can update their own service request details

### Employee
- Can view all service requests and contact forms from all customers
- Can update status and add notes to any request
- Can delete any request or form
- All edits are tracked with timestamp and editor information

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- Protected API routes
- Role-based access control
- Input validation using express-validator
- Environment variables for sensitive data

## Project Structure

```
mern-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Context API
│   │   ├── services/      # API services
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   └── server.js     # Entry point
│   ├── .env              # Environment variables (NOT in git)
│   ├── .env.example      # Example env file
│   └── package.json
└── README.md
```

## Deployment

### Backend (Heroku, Railway, or Render)
1. Push your code to GitHub (make sure .env is in .gitignore)
2. Create a new app on your hosting platform
3. Set environment variables in the platform's settings
4. Connect your GitHub repository
5. Deploy

### Frontend (Vercel or Netlify)
1. Build the React app: `npm run build`
2. Deploy the `build` folder
3. Set the API URL environment variable to your backend URL

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

ISC

## Support

For issues and questions, please open an issue in the GitHub repository.
