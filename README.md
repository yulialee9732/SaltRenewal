# MERN Stack - Customer & Employee Portal

A full-stack MERN application with separate customer and employee portals for managing service requests and contact forms.

## Features

### Customer Portal
- User registration and authentication
- Submit A/S (After-Sales) service requests
- Submit contact forms
- View own service requests and contact forms
- Track status of submissions

### Employee Portal
- Employee authentication
- View all service requests from all customers
- View all contact forms from all customers
- Edit and update service requests (with notes)
- Edit and update contact forms (with notes)
- View edit history with timestamps and editor information
- Delete requests and forms
- Change status and priority of requests

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database (MongoDB Atlas)
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **nodemailer** - Email notifications
- **Google Sheets API** - Form submission tracking (optional)

### Frontend
- **React** - UI library
- **React Router** - Routing
- **Axios** - HTTP client
- **Context API** - State management

## New Features

### 🎯 Google Sheets Integration
All form submissions are now automatically saved to Google Sheets in real-time:
- Price Estimate submissions
- Service Request submissions
- Contact Form submissions

**Setup Guide:** See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for detailed instructions.
**Quick Start:** See [GOOGLE_SHEETS_QUICK_START.md](./GOOGLE_SHEETS_QUICK_START.md) for a 5-minute setup guide.

> **Note:** Google Sheets integration is optional. The app works perfectly without it, saving all data to MongoDB.

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (free tier available)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd mern-app
```

2. **Install server dependencies**
```bash
cd server
npm install
```

3. **Configure environment variables**

Create a `.env` file in the `server` directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `server/.env` file with your credentials:
```
PORT=5001
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mern-app?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
NODE_ENV=development
```

**Important:** 
- Replace `username:password` with your MongoDB Atlas credentials
- If your password contains special characters, URL encode them:
  - `!` = `%21`
  - `@` = `%40`
  - `#` = `%23`
  - `$` = `%24`
- Generate a strong random JWT_SECRET (recommended: use `openssl rand -base64 32`)

4. **Install client dependencies**
```bash
cd ../client
npm install
```

### MongoDB Atlas Setup

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster (M0 free tier)
3. Set up Database Access:
   - Add a new database user
   - Set username and password
   - Grant "Read and write to any database" privileges
4. Set up Network Access:
   - Add IP address
   - For development, you can allow access from anywhere (0.0.0.0/0)
   - For production, restrict to your server's IP
5. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

## Running the Application

### Development Mode

1. **Start the server** (from server directory)
```bash
cd server
npm run dev
```
Server runs on http://localhost:5001

2. **Start the client** (from client directory, in a new terminal)
```bash
cd client
npm start
```
Client runs on http://localhost:3000

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
