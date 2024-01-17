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
  "Whoops! Error connecting to the database–please try again!";

// OnRoute hook to list endpoints
const routes = { endpoints: [] };
fastify.addHook("onRoute", routeOptions => {
  routes.endpoints.push(routeOptions.method + " " + routeOptions.path);
});

// Just send some info at the home route
fastify.get("/", (request, reply) => {
  const data = {
    title: "Hello SQLite (blank)",
    intro: "This is a database-backed API with the following endpoints",
    routes: routes.endpoints
  };
  reply.status(200).send(data);
});

// Return the chat messages from the database helper script - no auth
fastify.get("/messages", async (request, reply) => {
  let data = {};
  const userId = request.query.user;
  data.chat = await db.getMessages(userId);
  console.log(data.chat);
  if(!data.chat) data.error = errorMessage;
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});


// Add new message
fastify.post("/message", async (request, reply) => {
  let data = {};
  data.success = await db.addMessage(request.body.message,request.body.user);
  const status = data.success ? 201 : 400;
  data.user=request.body.user;
  reply.status(status).send(data);
});

// Update text for an message
fastify.put("/message", async (request, reply) => { 
  let data = {};
  if(!request.body || !request.body.id || !request.body.message) data.success = false;
  else data.success = await db.updateMessage(request.body.id, request.body.message); 
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});

// Delete a message
fastify.delete("/message", async (request, reply) => {
  let data = {};
  if(!request.query || !request.query.id) data.success = false;
  else data.success = await db.deleteMessage(request.query.id);
  const status = data.success ? 201 : 400;
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

