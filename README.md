
This is the online bookstore website I made for my brother.
# Book Store Backend

This repository contains the backend for the Book Store project. It is built with **Node.js** and **Express** and is designed to handle user authentication, book management, and more. It is connected to a **MongoDB** database to store user data and book information.

## Features

- User authentication (Sign Up, Login)
- User contact information management
- Book catalog management
- Role-based access (Admin, User)
- RESTful API with Express

## Prerequisites

- Node.js (version 14 or higher)
- MongoDB (or MongoDB Atlas)

## Installation

### Clone the repository

```bash
git clone https://github.com/your-username/BOOK-STORE.git
cd BOOK-STORE
```

### Install dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

### Set up environment variables

Create a `.env` file in the root of the project with the following variables:

```env
PORT=5000
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-jwt-secret
```

Replace `your-mongodb-uri` and `your-jwt-secret` with your MongoDB connection URI and JWT secret key.

### Run the application

To start the backend server, run:

```bash
npm start
```

The server will run on `http://localhost:1000`.

## API Endpoints

### POST `/api/signup`

- **Description**: Registers a new user with name, email, password, and contact information.
- **Request body**:
  ```json
  {
    "name": "Alice",
    "email": "ak@example.com",
    "password": "password123",
    "address": "xyz"
  }
  ```

### POST `/api/login`

- **Description**: Logs in a user and returns a JWT token.
- **Request body**:
  ```json
  {
    "email": "smn@example.com",
    "password": "password123"
  }
  ```

## Database Structure

- **Users**: Store user information including name, email, password, contact, and role.
- **Books**: (if applicable) Store book details including title, author, and availability.

## Contributing

Feel free to fork the repository and submit pull requests.

## License

This project is licensed under the MIT License.
