# Quiz-App-EE4253

## How to run the application:

### 1. Clone the repository:

Install git on [https://git-scm.com/downloads](https://git-scm.com/downloads) and clone the repository using the following command:

```
git clone https://github.com/Piceratop/Quiz-App-EE4253.git
```

### 2. Install dependencies:

Install NodeJS on [https://nodejs.org/en/download/prebuilt-installer/current](https://nodejs.org/en/download/prebuilt-installer/current). In the 'frontend' directory, run the following command to install the required dependencies:

```
npm install
```

In the 'backend' directory, run the following command to install the required dependencies:

```
npm install
```

### 3. Run the server:

Install and start MongoDB Community Server, or create a free MongoDB Atlas database. A local `backend/.env` has been created for MongoDB Community Server; otherwise, in the `backend` directory, copy `.env.example` to `.env` and set these values:

```
MONGODB_URI=mongodb://localhost:27017/quiz_app
JWT_SECRET=<a-long-random-secret>
```

For MongoDB Atlas, use its connection string as `MONGODB_URI`. You may set `MONGODB_DB_NAME=quiz_app` if the URI does not include a database name. The application creates its collections and indexes on startup; no SQL setup is required.

Then run the following command to start the backend server:

```
npm run dev
```

### 4. Run the application:

In the 'frontend' directory, run the following command to start the frontend application:

```
npm run dev
```
