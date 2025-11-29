# Backend Structure Documentation

## Overview

The backend has been restructured to follow clean architecture principles with proper separation of concerns.

## Directory Structure

```
backend/
├── controllers/          # Business logic handlers
│   ├── authController.ts
│   ├── patentController.ts
│   ├── walletController.ts
│   ├── aiController.ts
│   ├── blockchainController.ts
│   ├── dashboardController.ts
│   ├── documentController.ts
│   ├── hashPackController.ts
│   └── searchController.ts
│
├── routes/              # Route definitions
│   ├── index.ts         # Main routes setup
│   ├── authRoutes.ts    # Authentication routes
│   ├── patentRoutes.ts  # Patent management routes
│   ├── walletRoutes.ts  # Wallet connection routes
│   ├── hashpackRoutes.ts # HashPack specific routes
│   └── legacyRoutes.ts  # Routes pending modularization
│
├── models/              # Data models
│   └── index.ts         # Re-exports from shared/schema
│
├── utils/               # Utility functions
│   ├── hashUtils.ts     # Hashing utilities
│   ├── fileUtils.ts     # File operations
│   └── validationUtils.ts # Input validation
│
├── services/            # Business services
│   ├── aiService.ts
│   ├── hederaService.ts
│   ├── contractSigningService.ts  # NEW: Wallet signature verification
│   └── authTimeoutService.ts
│
├── shared/              # Shared resources
│   └── schema.ts        # Database schema
│
├── types/               # TypeScript type definitions
│
├── uploads/             # File uploads directory
│
├── auth.ts              # Authentication middleware
├── roleMiddleware.ts    # Role-based access control
├── storage.ts           # Database storage layer
├── db.ts                # Database connection
└── index.ts             # Application entry point
```

## Key Improvements

### 1. Modular Routes

Routes are now organized by feature:

- **authRoutes.ts**: User authentication, registration, profile management
- **patentRoutes.ts**: Patent CRUD operations
- **walletRoutes.ts**: Wallet configuration and management
- **legacyRoutes.ts**: Routes pending migration (dashboard, AI, blockchain, etc.)

### 2. Utility Functions

Common operations extracted to utility modules:

- **hashUtils.ts**: SHA-256 hashing, file hashing, hash verification
- **fileUtils.ts**: File operations, directory management, unique filename generation
- **validationUtils.ts**: Input validation, email/password checks, file type validation

### 3. Contract Signing Service

New service for wallet signature verification:

```typescript
import contractSigningService from './services/contractSigningService';

// Generate signing message
const message = contractSigningService.generatePatentSigningMessage(data);

// Verify signature
const result = await contractSigningService.verifyHederaSignature(
  message,
  signature,
  publicKey,
  accountId
);
```

### 4. Clean Separation of Concerns

- **Controllers**: Handle request/response, call services
- **Routes**: Define endpoints, apply middleware
- **Services**: Implement business logic
- **Utils**: Provide reusable functions
- **Models**: Define data structures

## Migration Guide

### For New Features

1. Create controller in `controllers/`
2. Create route file in `routes/`
3. Import and mount in `routes/index.ts`
4. Add utility functions to `utils/` if needed

### For Existing Routes

Routes in `legacyRoutes.ts` should be gradually migrated:

1. Extract business logic to controller
2. Create dedicated route file
3. Update `routes/index.ts` to mount new routes
4. Remove from `legacyRoutes.ts`

## Contract Signing Integration

### Patent Filing with Signature

When filing a patent, the frontend should:

1. Generate signing data:
```typescript
const signingData = {
  patentId: uuid(),
  title: patentData.title,
  description: patentData.description,
  category: patentData.category,
  userId: currentUser.id,
  timestamp: Date.now()
};
```

2. Sign with wallet (HashPack or legacy)

3. Submit with signature:
```typescript
POST /api/patents
{
  ...patentData,
  signature: "hex_signature",
  publicKey: "hex_public_key",
  signedMessage: "original_message"
}
```

### Backend Verification

The backend automatically verifies signatures:

```typescript
// In patentController.createPatent
const verificationResult = await contractSigningService.verifyHederaSignature(
  signedMessage,
  signature,
  publicKey,
  walletConfig.accountId
);

if (!verificationResult.isValid) {
  return res.status(400).json({
    message: 'Invalid contract signature'
  });
}
```

## Best Practices

1. **Controllers**: Keep thin, delegate to services
2. **Routes**: Only define endpoints and middleware
3. **Services**: Implement complex business logic
4. **Utils**: Pure functions, no side effects
5. **Error Handling**: Always use try-catch, return meaningful errors
6. **Validation**: Validate inputs using Zod schemas
7. **Security**: Use middleware for authentication/authorization

## Testing

```bash
# Run backend
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Required environment variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret
HEDERA_NETWORK=testnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=...
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/user` - Get current user

### Patents
- `GET /api/patents` - List user's patents
- `GET /api/patents/:id` - Get patent details
- `POST /api/patents` - Create patent (with signature)
- `PUT /api/patents/:id` - Update patent
- `DELETE /api/patents/:id` - Delete patent

### Wallet
- `POST /api/wallet/configure` - Configure wallet
- `GET /api/wallet/status` - Get wallet status
- `DELETE /api/wallet/disconnect` - Disconnect wallet
- `POST /api/wallet/validate` - Validate wallet credentials

## Future Improvements

1. Complete migration of all routes from `legacyRoutes.ts`
2. Add comprehensive API documentation (Swagger/OpenAPI)
3. Implement rate limiting
4. Add request logging middleware
5. Create integration tests
6. Add API versioning
7. Implement caching layer

## Support

For questions or issues, please refer to the main README.md or create an issue in the repository.
