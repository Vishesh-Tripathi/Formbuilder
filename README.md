# Form Builder Next

A comprehensive form builder application with drag-and-drop interface, analytics, and file upload support.

## Features

### Frontend
- **Dashboard**: Form management with create, edit, delete, duplicate operations
- **Form Builder**: Drag-and-drop interface for building forms
- **Field Types**: Text, email, select, checkbox, radio, textarea, file upload, number, date
- **Field Configuration**: Validation rules, required fields, placeholder text, options
- **Form Settings**: Title, description, custom thank you message, submission limits
- **Analytics**: Submission count, response charts, export to CSV
- **Preview Mode**: Test forms before publishing
- **Responsive Design**: Works on desktop, tablet, and mobile

### Backend
- **REST API**: CRUD operations for forms and submissions
- **File Upload**: Support for image/document uploads with validation
- **Validation**: Server-side form validation and sanitization
- **Rate Limiting**: Prevent spam submissions
- **Analytics**: Submission statistics and data export
- **CORS**: Enable cross-origin form submissions
- **Error Handling**: Structured error responses

### Technical Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, React Hook Form, React DnD
- **Backend**: Node.js, Express, TypeScript, MongoDB, Mongoose
- **File Upload**: Multer with file type validation
- **Deployment**: Docker containerization

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB 5+
- Docker (optional)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd formbuildernext
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Create environment files:
```bash
# In the root directory
cp .env.example .env

# In the server directory
cp .env.example .env
```

5. Start MongoDB (if not using Docker):
```bash
mongod --dbpath /path/to/your/db
```

6. Start the server:
```bash
cd server
npm run dev
```

7. Start the client:
```bash
cd client
npm run dev
```

The application will be available at:
- Client: http://localhost:5173
- Server: http://localhost:5000

### Docker Deployment

1. Build and start all services:
```bash
docker-compose up --build
```

2. The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: localhost:27017

### Production Deployment

1. Update environment variables in `.env`
2. Build the client:
```bash
cd client
npm run build
```

3. Build the server:
```bash
cd server
npm run build
```

4. Use Docker Compose for production:
```bash
docker-compose -f docker-compose.yml up -d
```

## API Endpoints

### Forms
- `GET /api/forms` - Get all forms
- `POST /api/forms` - Create a new form
- `GET /api/forms/:id` - Get specific form
- `PUT /api/forms/:id` - Update form
- `DELETE /api/forms/:id` - Delete form
- `POST /api/forms/:id/duplicate` - Duplicate form
- `PATCH /api/forms/:id/status` - Update form status
- `GET /api/forms/public/:slug` - Get public form by slug

### Submissions
- `POST /api/submissions/:formId` - Submit form response
- `GET /api/submissions/:formId` - Get form submissions (admin)
- `GET /api/submissions/:formId/:submissionId` - Get specific submission
- `DELETE /api/submissions/:formId/:submissionId` - Delete submission
- `GET /api/submissions/:formId/export` - Export submissions as CSV

### File Upload
- `POST /api/upload` - Upload files
- `DELETE /api/upload/:filename` - Delete uploaded file
- `GET /api/upload/info/:filename` - Get file information

### Analytics
- `GET /api/analytics/:formId` - Get form analytics
- `GET /api/analytics/:formId/export` - Export analytics as CSV
- `GET /api/analytics/dashboard/overview` - Dashboard overview

## Form Field Types

1. **Text**: Single-line text input
2. **Email**: Email validation
3. **Select**: Dropdown selection
4. **Checkbox**: Multiple selection
5. **Radio**: Single selection from options
6. **Textarea**: Multi-line text input
7. **File**: File upload with type validation
8. **Number**: Numeric input with min/max validation
9. **Date**: Date picker input

## Configuration

### Server Configuration
- Port: 5000 (default)
- MongoDB: Connection string
- JWT: Secret key for authentication
- CORS: Allowed origins
- Upload: File size limits and allowed types

### Client Configuration
- API URL: Backend server URL
- Theme: Light/dark mode support
- File Upload: Maximum file size and types

### File Upload Limits
- Maximum file size: 5MB per file
- Maximum files per upload: 5
- Allowed types: Images, PDFs, Documents, Text files

## Development

### Project Structure
```
formbuildernext/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities
│   │   └── types/         # TypeScript types
│   ├── public/            # Static assets
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── config/        # Configuration
│   └── package.json
├── docker-compose.yml      # Docker configuration
└── README.md
```

### Adding New Field Types

1. Add field type to the `IFormField` interface
2. Update the form builder drag-and-drop components
3. Add validation logic in the backend
4. Update the form rendering component

### Database Schema

#### Form Schema
- title, description, fields, settings
- status (draft/published/archived)
- submission count and analytics
- timestamps and versioning

#### Submission Schema
- form reference, responses array
- submitter information (optional)
- metadata and timestamps

## Security Features

- Rate limiting on submissions and file uploads
- File type validation and size limits
- Input sanitization and validation
- CORS configuration
- Helmet security headers
- Error handling without sensitive information

## Analytics Features

- Submission trends over time
- Field response analysis
- Completion rates
- Device/browser analytics (if available)
- CSV export for submissions and analytics
- Dashboard overview with key metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.
