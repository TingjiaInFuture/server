# ServerApi for Milin app

This is a Node.js server script using the Fastify framework and SQLite database. It provides the following API endpoints:

- GET /: Returns some basic information and all available API endpoints.
- GET /messages: Returns chat messages from the database based on the username in the query parameters.
- POST /register: Registers a new user. Returns an error if the username already exists.
- POST /login: Logs in a user. Returns an error if the username or password is invalid.
- POST /message: Adds a new message.
- ......(others in progress)
