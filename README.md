# Login System

Visit now: [Link here](https://express-session-login-system.herokuapp.com/)

This is a simple login system project done using NodeJS entirely by AdmiJW. Packages used:

* express
* pug
* bcryptjs
* express-session
* mongoose
* connect-mongodb-session
* dotenv

---

## Environment Variables

The environment variables that has to be set in .env file for the application to work correctly:

| Environment Variable | Description |
|----------------------|-------------|
| `PORT` | Port number for express application. If absent, defaults to port 3000 |
| `MONGO_URL` | MongoDB connection string. Database used to store Users and Session data |
| `SECRET` | Secret in encrypting session ID |
| `SALT_ROUNDS` | Salt rounds used in bcryptjs in hashing of password |

---

## Usage

Simply clone the repository, setup the .env file as listed in table above, and run `node index.js` or `npm start`

---

ps: There is a better approach to user authentication, using `passport.js`. This project serves to learning purpose only.
