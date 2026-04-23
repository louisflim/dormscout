# DormScout Full Stack Setup Guide

This guide explains how to set up and run both the React frontend and Spring Boot backend for the DormScout application.

## Project Structure

```
dormscout/
├── frontend/               # React application
│   ├── src/
│   ├── package.json
│   └── README.md
├── backend/               # Spring Boot application
│   ├── src/
│   ├── pom.xml
│   └── README.md
└── README.md
```

## Prerequisites

### Frontend
- Node.js 16+ 
- npm or yarn

### Backend
- Java 17+
- Maven 3.6+
- MySQL 8.0+ (optional, uses H2 by default)

## Quick Start

### Step 1: Start the Backend

```bash
cd backend

# Build the project
mvn clean package

# Run the Spring Boot application
mvn spring-boot:run
```

The backend will be available at `http://localhost:8080`

Check if it's running: `http://localhost:8080/h2-console` (H2 console for development)

### Step 2: Start the Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
```

The frontend will open at `http://localhost:3000`

## API Communication

The frontend communicates with the backend through REST APIs. The base URL is configured in:
```
frontend/src/utils/api.js
```

Default API base URL: `http://localhost:8080/api`

## Available Features

### Authentication
- User registration (with email validation)
- User login
- User logout

### Listings (For Landlords)
- Create new property listings
- View all listings
- Edit listings
- Delete listings
- View bookings for each listing

### Bookings (For Tenants)
- Browse available listings
- Create booking requests
- View booking history
- Check booking status

### Dashboard
- View statistics
- Recent activities
- Quick actions

## Database

### Development (H2 In-Memory)
- Automatically initialized
- Console available at `http://localhost:8080/h2-console`
- Credentials: username: `sa`, password: (empty)

### Production (MySQL)
To use MySQL:

1. Create database:
```sql
CREATE DATABASE dormscout;
```

2. Update `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/dormscout
spring.datasource.username=root
spring.datasource.password=your_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect
```

3. Restart the backend

## Testing

### Frontend Tests
```bash
cd frontend
npm test
```

### Backend Tests
```bash
cd backend
mvn test
```

## API Endpoints Summary

### Users
```
POST   /api/users/register              # Register new user
POST   /api/users/login                 # Login user
GET    /api/users                       # Get all users
GET    /api/users/{id}                  # Get user by ID
PUT    /api/users/{id}                  # Update user
DELETE /api/users/{id}                  # Delete user
```

### Listings
```
POST   /api/listings                    # Create listing
GET    /api/listings                    # Get all listings
GET    /api/listings/active             # Get active listings
GET    /api/listings/{id}               # Get listing by ID
GET    /api/listings/landlord/{id}      # Get landlord's listings
PUT    /api/listings/{id}               # Update listing
DELETE /api/listings/{id}               # Delete listing
```

### Bookings
```
POST   /api/bookings                    # Create booking
GET    /api/bookings                    # Get all bookings
GET    /api/bookings/{id}               # Get booking by ID
GET    /api/bookings/tenant/{id}        # Get tenant's bookings
GET    /api/bookings/listing/{id}       # Get listing's bookings
PUT    /api/bookings/{id}/status        # Update booking status
PUT    /api/bookings/{id}               # Update booking
DELETE /api/bookings/{id}               # Delete booking
```

## Troubleshooting

### Backend won't start
- Check if port 8080 is available
- Ensure Java 17+ is installed: `java -version`
- Check Maven is installed: `mvn -version`

### Frontend can't connect to backend
- Ensure backend is running on port 8080
- Check if CORS is properly configured
- Clear browser cache

### Database issues
- Check H2 console at `http://localhost:8080/h2-console`
- For MySQL, verify database credentials
- Check `application.properties` settings

## Development Workflow

1. **Backend changes**: Modify Java files, restart `mvn spring-boot:run`
2. **Frontend changes**: Hot reload is enabled, just save files
3. **Database schema changes**: Update entity files, restart backend

## Building for Production

### Frontend
```bash
cd frontend
npm run build
```

### Backend
```bash
cd backend
mvn clean package -DskipTests
```

This creates a JAR file in `backend/target/` that can be deployed.

## Environment Variables (Optional)

Create `.env` files to override defaults:

**backend/.env**
```
SPRING_DATASOURCE_URL=jdbc:mysql://db:3306/dormscout
SPRING_DATASOURCE_USERNAME=root
SPRING_DATASOURCE_PASSWORD=password
```

**frontend/.env**
```
REACT_APP_API_BASE_URL=http://backend-url:8080/api
```

## Docker (Optional)

To containerize the application:

```bash
# Build backend image
cd backend
docker build -t dormscout-backend .

# Build frontend image
cd frontend
docker build -t dormscout-frontend .

# Run with docker-compose
docker-compose up
```

## Next Steps

- [ ] Implement JWT authentication
- [ ] Add email verification
- [ ] Implement messaging system
- [ ] Add notifications
- [ ] Create admin dashboard
- [ ] Setup CI/CD pipeline
- [ ] Deploy to production

## Support

For issues or questions, refer to:
- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)

## License

MIT License - See LICENSE file for details
