/**
 * This is the main server script that provides the API endpoints
 * The script uses the database helper in /src
 * The endpoints retrieve, update, and return data to the page handlebars files
 *
 * The API returns the front-end UI handlebars pages, or
 * Raw json if the client requests it with a query parameter ?raw=json
 */

// Utilities we need
const fs = require("fs");
const path = require("path");

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

// Setup our static files
/*
fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "public"),
  prefix: "/" // optional: default '/'
});*/

// fastify-formbody lets us parse incoming forms
fastify.register(require("fastify-formbody"));

// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

/**
* We just send an HTML page at the home route
*/
fastify.get("/", (request, reply) => {
  const page = fs.readFileSync('./src/pages/index.html');
  reply.type('text/html').send(page);
});

/**
 * Return the poll options from the database helper script
 */
fastify.get("/options", async (request, reply) => {
  let data = {};
  // Get the available choices from the database
  data.options = await db.getOptions();
  data.error = data.options ? null : data.errorMessage;
  reply.status(200).send(data);
});

/**
 * Post route to process vote
 *
 * Retrieve vote from body data
 * Send vote to database helper
 * Return updated list of votes
 */
fastify.post("/option", async (request, reply) => {
  let data = {};
  let err = null;
  if (request.body.language) 
    data.options = await db.processVote(request.body.language);
  else err = 'No vote received in body!'
  data.error = data.options ? err : data.errorMessage;
  let status = data.error ? 400 : 201;
  reply.status(status).send(data);
});

/**
 * Admin endpoint returns log of votes
 */
fastify.get("/logs", async (request, reply) => {
  let data = {};
  // Get the log history from the db
  data.optionHistory = await db.getLogs();
  data.error = data.optionHistory ? null : data.errorMessage;
  let status = data.error ? 400 : 201;
  reply.status(status).send(data);
});

/**
 * Admin endpoint to empty all logs
 *
 * Requires authorization (see setup instructions in README)
 * If auth fails, return a 401 and the log list
 * If auth is successful, empty the history
 */
fastify.post("/reset", async (request, reply) => {
  let data = {};
  
  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    data.failed = "You entered invalid credentials!";

    data.optionHistory = await db.getLogs();
  } else {
    data.optionHistory = await db.clearHistory();

    data.error = data.optionHistory ? null : data.errorMessage;
  }

  const status = data.failed ? 401 : 200;
  reply.status(status).send(data);
});

// Run the server and report out to the logs
fastify.listen(process.env.PORT, function(err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
  fastify.log.info(`server listening on ${address}`);
});
