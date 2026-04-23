# DormScout Backend

Spring Boot backend for the DormScout application.

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- MySQL 8.0+ (optional, for production)

## Project Structure

```
src/main/java/com/dormscout/backend/
├── DormscoutBackendApplication.java    # Main Spring Boot application
├── entity/                              # JPA entities
│   ├── User.java
│   ├── Listing.java
│   └── Booking.java
├── repository/                          # Spring Data repositories
│   ├── UserRepository.java
│   ├── ListingRepository.java
│   └── BookingRepository.java
├── service/                             # Business logic services
│   ├── UserService.java
│   ├── ListingService.java
│   └── BookingService.java
├── controller/                          # REST API controllers
│   ├── UserController.java
│   ├── ListingController.java
│   └── BookingController.java
├── dto/                                 # Data Transfer Objects
│   ├── UserDTO.java
│   └── LoginRequest.java
└── config/                              # Spring configurations
    ├── CorsConfig.java
    └── SecurityConfig.java
```

## Setup & Installation

### 1. Clone the Repository

```bash
cd backend
```

### 2. Build the Project

```bash
mvn clean package
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

### 4. Database Setup (Optional - for MySQL)

If you want to use MySQL instead of H2:

1. Edit `src/main/resources/application.properties`
2. Uncomment the MySQL configuration
3. Create a database: `CREATE DATABASE dormscout;`
4. Update the connection details

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user

### Users

- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `GET /api/users/email/{email}` - Get user by email
- `GET /api/users/type/{userType}` - Get users by type (tenant/landlord)
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Listings

- `POST /api/listings?landlordId={id}` - Create listing
- `GET /api/listings` - Get all listings
- `GET /api/listings/active` - Get active listings
- `GET /api/listings/{id}` - Get listing by ID
- `GET /api/listings/landlord/{landlordId}` - Get listings by landlord
- `PUT /api/listings/{id}` - Update listing
- `DELETE /api/listings/{id}` - Delete listing

### Bookings

- `POST /api/bookings?tenantId={id}&listingId={id}` - Create booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/{id}` - Get booking by ID
- `GET /api/bookings/tenant/{tenantId}` - Get bookings by tenant
- `GET /api/bookings/listing/{listingId}` - Get bookings by listing
- `PUT /api/bookings/{id}/status?status={status}` - Update booking status
- `PUT /api/bookings/{id}` - Update booking
- `DELETE /api/bookings/{id}` - Delete booking

## H2 Database Console

When running with H2 (development), access the console at:
`http://localhost:8080/h2-console`

## Integration with Frontend

The React frontend at `/frontend` is configured to communicate with this backend at `http://localhost:8080`.

To modify the API base URL, edit `frontend/src/utils/api.js`

## Technologies Used

- Spring Boot 3.2.4
- Spring Data JPA
- Spring Security
- Spring Web
- MySQL/H2 Database
- Lombok
- JWT (JSON Web Tokens)

## Development

### Running Tests

```bash
mvn test
```

### Building for Production

```bash
mvn clean package -DskipTests
```

This creates a JAR file in `target/` directory that can be deployed.

## CORS Configuration

CORS is enabled for `http://localhost:3000` (React frontend). To modify this, edit `src/main/java/com/dormscout/backend/config/CorsConfig.java`

## Security

- Passwords are encrypted using BCrypt
- CORS is restricted to frontend origin only
- All endpoints require proper authentication

## Future Enhancements

- JWT token-based authentication
- Refresh tokens
- Email verification
- Password reset
- User profiles with avatars
- Messaging system
- Notifications
- Review and rating system

## Support

For issues or questions, please contact the development team.
