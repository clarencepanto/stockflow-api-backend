# 📦 StockFlow API

A comprehensive inventory management and orders API with real-time updates.

![CI/CD](https://github.com/clarencepanto/stockflow-api/workflows/CI%2FCD%20Pipeline/badge.svg)

## 🚀 Features

- ✅ JWT Authentication with role-based access control (ADMIN/STAFF)
- ✅ Product management with full CRUD operations
- ✅ Inventory tracking with adjustment history
- ✅ Order management with multi-item support
- ✅ Real-time updates via Socket.IO
- ✅ Interactive API documentation (Swagger)
- ✅ Comprehensive test coverage
- ✅ TypeScript for type safety
- ✅ PostgreSQL database with Prisma ORM

## 🛠️ Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL, Prisma ORM
- **Authentication:** JWT, bcrypt
- **Validation:** Zod
- **Real-time:** Socket.IO
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest, Supertest
- **CI/CD:** GitHub Actions

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL (or Supabase account)
- npm or yarn

## 🔧 Installation

1. **Clone the repository:**

```bash
   git clone https://github.com/YOUR-USERNAME/stockflow-api.git
   cd stockflow-api
```

2. **Install dependencies:**

```bash
   npm install
```

3. **Set up environment variables:**

```bash
   cp .env.example .env
```

Edit `.env` with your database credentials:

```
   DATABASE_URL="postgresql://user:password@localhost:5432/stockflow"
   JWT_SECRET="your-secret-key-here"
   PORT=3000
```

4. **Run database migrations:**

```bash
   npm run prisma:migrate
```

5. **Generate Prisma client:**

```bash
   npm run prisma:generate
```

6. **Start development server:**

```bash
   npm run dev
```

The API will be running at `http://localhost:3000`

## 📚 API Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api-docs
```

## 🧪 Testing

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## 🐳 Docker

Build and run with Docker:

```bash
docker-compose up -d
```

## 📁 Project Structure

```
stockflow-api/
├── src/
│   ├── controllers/       # Business logic
│   ├── routes/           # API routes
│   ├── middleware/       # Auth, validation, etc.
│   ├── utils/            # Helper functions
│   ├── config/           # Configuration files
│   ├── types/            # TypeScript types
│   ├── __tests__/        # Test files
│   └── index.ts          # Entry point
├── prisma/
│   └── schema.prisma     # Database schema
├── .github/
│   └── workflows/        # CI/CD workflows
└── package.json
```

## 🔐 Environment Variables

| Variable       | Description                               | Required |
| -------------- | ----------------------------------------- | -------- |
| `DATABASE_URL` | PostgreSQL connection string              | Yes      |
| `JWT_SECRET`   | Secret key for JWT tokens                 | Yes      |
| `PORT`         | Server port (default: 3000)               | No       |
| `NODE_ENV`     | Environment (development/production/test) | No       |

## 📡 Real-time Events

Socket.IO events:

- `stock:updated` - Emitted when inventory changes
- `order:created` - Emitted when new order is placed

## 🚀 Deployment

### Deploy to Railway:

1. Create account at [Railway.app](https://railway.app)
2. Install Railway CLI:

```bash
   npm i -g @railway/cli
```

3. Login and deploy:

```bash
   railway login
   railway init
   railway up
```

### Deploy to Render:

1. Create account at [Render.com](https://render.com)
2. Connect your GitHub repository
3. Set environment variables
4. Deploy!

## 📝 Available Scripts

| Script                    | Description              |
| ------------------------- | ------------------------ |
| `npm run dev`             | Start development server |
| `npm run build`           | Build for production     |
| `npm start`               | Start production server  |
| `npm test`                | Run tests                |
| `npm run test:watch`      | Run tests in watch mode  |
| `npm run test:coverage`   | Generate coverage report |
| `npm run prisma:migrate`  | Run database migrations  |
| `npm run prisma:generate` | Generate Prisma client   |
| `npm run prisma:studio`   | Open Prisma Studio       |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Clarence Panto

## 🙏 Acknowledgments

- Built during a learning journey with Claude
- Inspired by real-world inventory management needs
