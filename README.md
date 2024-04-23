# Task manager app

This is a backend API for a task management application built using Express and MongoDB.

## Features

- **User Authentication:** Authenticate users using JWT and protect their personal data and operations.
- **Task Management:** Allow users to create, read, update, and delete tasks, with each task associated with a specific user.
- **Image Upload:** Users can upload and delete avatar images, which will be automatically resized and formatted.

## Technology Stack

- Node.js
- Express.js
- MongoDB
- JWT
- Multer (for handling file uploads)
- Sharp (for image processing)

## Installation and Usage

1. Clone the project to your local machine:

```bash
git clone https://github.com/ywuuu019/task-manager-app.git
```

2. Install dependencies:
```bash
cd task-manager-app
npm install
```

3. Create a .env file in the root directory and configure environment variables:
```bash
PORT=3000
EMAIL_ARN="arn:aws:ses:ap-northeast-1:...."
DB_NAME=task-manager-api
DB_URI=""
JWT_SECRET=yourjwtsecret
```

4. Start the application
```bash
npm start
```

5. Test the API endpoints using Postman or other API testing tools.

## API Documentation
API documentation can be viewed in [Swagger UI](https://link.com). Here are some commonly used endpoints:

- `POST /users`: Create a new user
- `POST /users/login`: User login
- `POST /users/logout`: User logout
- `POST /users/logoutAll`: User logout from all device
- `POST /tasks`: Create a new task
- `GET /users/me`: Get information of the currently logged-in user
- `GET /tasks`: Get the list of tasks for the current user
- `PATCH /tasks/:id`: Update a specific task
- `PATCH /users/me`: Update my information
- `DELETE /tasks/:id`: Delete a specific task
- `DELETE /users/me`: Delete user account

## Running Tests
This project includes test cases for the API endpoints using Jest and Supertest.
To run the tests, execute the following command:

```bash
npm test
```

### Test Cases
- **Signup a New User:** Test whether a new user can sign up successfully.
- **Login Existing User:** Test whether an existing user can log in successfully.
- **Failed Login:** Test for login with incorrect credentials.
- **Get User Profile:** Test whether user profile can be retrieved successfully.
- **Delete User Account:** Test whether a user account can be deleted successfully.
- **Upload Avatar:** Test whether user can upload an avatar image successfully.
- **Update User Information:** Test whether user information can be updated successfully.

### Test Environment
- **Testing Framework:** Jest
- **HTTP Request Library:** Supertest
- **Database:** MongoDB 

### Mocking
- **AWS SES Mock:** Mocked SES for sending email notifications.
