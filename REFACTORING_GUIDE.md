# DSQ System Refactoring Guide

## Tổng quan về việc Refactoring

Dự án DSQ System đã được refactor để có cấu trúc code clean và clear hơn, dễ bảo trì và mở rộng.

## Cấu trúc Backend mới

### Cấu trúc thư mục:
```
backend/
├── app/                          # Main application code
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication routes
│   │   ├── users/                # User management routes
│   │   ├── call_numbers/         # Call number routes
│   │   ├── printing/             # Printing routes
│   │   └── routes.py             # Main router
│   ├── config/                   # Configuration
│   │   ├── settings.py           # App settings
│   │   └── database.py           # Database config
│   ├── core/                     # Core functionality
│   │   ├── auth.py               # JWT utilities
│   │   ├── security.py           # Password hashing
│   │   └── dependencies.py       # Common dependencies
│   ├── models/                   # Database models
│   ├── schemas/                  # Pydantic schemas
│   ├── services/                 # Business logic layer
│   │   ├── call_number_service.py
│   │   ├── printing_service.py
│   │   └── ...
│   ├── utils/                    # Utilities
│   │   ├── constants.py          # Application constants
│   │   └── helpers.py            # Helper functions
│   └── main.py                   # FastAPI app
└── requirements.txt
```

### Các cải thiện chính:

1. **Separation of Concerns**: Tách biệt rõ ràng giữa API routes, business logic (services), và data models
2. **Service Layer**: Thêm service layer để xử lý business logic
3. **Configuration Management**: Tập trung cấu hình vào module config
4. **Utilities**: Tách constants và helper functions
5. **Better Error Handling**: Xử lý lỗi nhất quán
6. **API Versioning**: Hỗ trợ versioning với prefix `/api/v1`

## Cấu trúc Frontend mới

### Cấu trúc thư mục:
```
frontend/src/
├── services/                     # API services
│   ├── api/                      # API clients
│   │   ├── client.js             # Base API client
│   │   ├── userService.js        # User API
│   │   ├── callNumberService.js  # Call number API
│   │   └── printingService.js    # Printing API
│   └── auth/                     # Authentication
│       └── authService.js        # Auth service
├── hooks/                        # Custom React hooks
│   ├── useAuth.js                # Authentication hook
│   └── useUsers.js               # User management hook
├── types/                        # TypeScript definitions
│   └── index.ts                  # Type definitions
├── components/                   # React components
├── pages/                        # Page components
├── utils/                        # Utilities
└── constants/                    # Constants
```

### Các cải thiện chính:

1. **Service Layer**: Tách logic API thành các service classes
2. **Custom Hooks**: Sử dụng custom hooks cho state management
3. **Type Safety**: Thêm TypeScript definitions
4. **Error Handling**: Xử lý lỗi nhất quán
5. **API Abstraction**: Tạo base API client với common functionality

## Migration Guide

### Backend Migration

1. **Cập nhật imports**: 
   - Thay `from db.database import get_db` bằng `from app.config.database import get_db`
   - Thay `from models.user import User` bằng `from app.models.user import User`

2. **Sử dụng services**:
   ```python
   # Trước
   def generate_number():
       # Logic trực tiếp trong route
   
   # Sau
   def generate_number():
       return CallNumberService.generate_number(...)
   ```

3. **Sử dụng dependencies**:
   ```python
   from app.core.dependencies import get_current_user, get_admin_user
   ```

### Frontend Migration

1. **Cập nhật API calls**:
   ```javascript
   // Trước
   fetch(`${API_URL}/auth/login`, {...})
   
   // Sau
   import { AuthService } from './services/auth/authService';
   AuthService.login(username, password);
   ```

2. **Sử dụng custom hooks**:
   ```javascript
   // Trước
   const [user, setUser] = useState(null);
   // Logic authentication phức tạp...
   
   // Sau
   import { useAuth } from './hooks/useAuth';
   const { user, login, logout } = useAuth();
   ```

## Backward Compatibility

Để đảm bảo ứng dụng hoạt động trong quá trình migration:

1. **Legacy Routes**: Giữ nguyên các legacy routes với prefix cũ
2. **Dual API Support**: Services hỗ trợ cả API mới và cũ
3. **Gradual Migration**: Có thể migrate từng component một cách từ từ

## Chạy ứng dụng

### Backend:
```bash
cd backend
python app/main.py
```

### Frontend:
```bash
cd frontend
npm run dev
```

## Lợi ích của việc Refactoring

1. **Maintainability**: Code dễ bảo trì và debug hơn
2. **Scalability**: Dễ dàng thêm features mới
3. **Testability**: Cấu trúc service layer giúp việc testing dễ dàng hơn
4. **Code Reusability**: Tái sử dụng code tốt hơn
5. **Error Handling**: Xử lý lỗi nhất quán và tập trung
6. **Type Safety**: TypeScript definitions giúp catch lỗi sớm
7. **API Versioning**: Hỗ trợ versioning cho tương lai

## Next Steps

1. **Hoàn thiện migration**: Chuyển đổi tất cả components sang sử dụng services mới
2. **Testing**: Thêm unit tests cho services và hooks
3. **Documentation**: Viết API documentation chi tiết
4. **Performance**: Optimize API calls và caching
5. **Security**: Review và cải thiện security measures
