/**
 * This is the main server script that provides the API endpoints
 *
 * Uses sqlite.js to connect to db
 */

const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

fastify.register(require("@fastify/formbody"));

const db = require("./sqlite.js");
const errorMessage =
  "Error connecting to the database!";


const routes = { endpoints: [] };
fastify.addHook("onRoute", routeOptions => {
  routes.endpoints.push(routeOptions.method + " " + routeOptions.path);
});


fastify.get("/", (request, reply) => {
  const data = {
    title: "Milin Server API",
    intro: "A database-backed API with the following endpoints",
    routes: routes.endpoints
  };
  reply.status(200).send(data);
});

// Return the chat messages from the database helper script - no auth
fastify.get("/messages", async (request, reply) => {
  let data = {};
  const username = request.query.username;
  data.chat = await db.getMessages(username);
  console.log(data.chat);
  if(!data.chat) data.error = errorMessage;
  const status = data.error ? 400 : 200;
  console.log("user:");
  console.log(username);
  console.log("data:");
  console.log(data);
  reply.status(status).send(data);
});

// User registration
fastify.post("/register", async (request, reply) => {
  let data = {};
  const usernameExists = await db.checkUsername(request.body.username);
  if (usernameExists) {
    data.success = false;
    data.error = "Username is already taken.";
  } else {
    data.success = await db.addUser(request.body.username, request.body.password);
  }
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});


fastify.get("/checkUsername", async (request, reply) => {
  let data = {};
  const userId = await db.checkUsername(request.query.username);
  if (userId) {
    data.userId = userId;
  } else {
    data.error = "Username does not exist.";
  }
  const status = data.userId ? 200 : 400;
  reply.status(status).send(data);
});

// User login
fastify.post("/login", async (request, reply) => {
  let data = {};
  data.userId = await db.login(request.body.username, request.body.password);
  if (!data.userId) {
    data.error = "Invalid username or password.";
  }
  const status = data.userId ? 200 : 400;
  reply.status(status).send(data);
});



// Add new message
fastify.post("/message", async (request, reply) => {
  let data = {};
  data.success = await db.addMessage(request.body.message, request.body.senderUsername, request.body.receiverUsername);
  const status = data.success ? 201 : 400;
  data.username = request.body.senderUsername;
  reply.status(status).send(data);
});

// Run the server and report out to the logs
fastify.listen({port:9000, host:'0.0.0.0'}, function(err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
});

// 获取所有的类别
fastify.get("/categories", async (request, reply) => {
  let data = {};
  data.categories = await db.getCategories();
  if(!data.categories) data.error = errorMessage;
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

// 添加新的类别
fastify.post("/categories", async (request, reply) => {
  let data = {};
  data.success = await db.addCategory(request.body.category);
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});
