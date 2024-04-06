/**
 * This is the main server script that provides the API endpoints
 *
 * Uses sqlite.js to connect to db
 */

const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false
});

const cors = require('@fastify/cors');
fastify.register(cors, {
  origin: true,
  credentials: true
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
  if (!data.chat) data.error = errorMessage;
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



// Upload avatar
fastify.post("/uploadAvatar", async (request, reply) => {
  let data = {};
  try {
    await db.uploadAvatar(request.body.userId, request.body.avatar);
    data.success = true;
  } catch (error) {
    data.error = "Error uploading avatar.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// Get avatar
fastify.get("/getAvatar", async (request, reply) => {
  let data = {};
  try {
    data.avatar = await db.getAvatar(request.query.userId);
    if (!data.avatar) {
      data.error = "Error getting avatar.";
    }
  } catch (error) {
    data.error = "Error getting avatar.";
  }
  const status = data.avatar ? 200 : 400;
  reply.status(status).send(data);
});

// Add experience
fastify.post("/addExperience", async (request, reply) => {
  let data = {};
  try {
    await db.addExperience(request.body.userId, request.body.experience);
    data.success = true;
  } catch (error) {
    data.error = "Error adding experience.";
  }
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// Get experience
fastify.get("/getExperience", async (request, reply) => {
  let data = {};
  try {
    data.experience = await db.getExperience(request.query.userId);
    if (data.experience === undefined) {
      data.error = "Error getting experience.";
    }
  } catch (error) {
    data.error = "Error getting experience.";
  }
  const status = data.experience !== undefined ? 200 : 400;
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
fastify.listen({ port: 9000, host: '0.0.0.0' }, function (err, address) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Your app is listening on ${address}`);
});

// 获取所有的类别
fastify.get("/categories", async (request, reply) => {
  const categories = await db.getCategories();
  if (!categories) {
    reply.status(400).send(errorMessage);
  } else {
    reply.status(200).send(categories);
  }
});


// 添加新的类别
fastify.post("/categories", async (request, reply) => {
  let data = {};
  data.success = await db.addCategory(request.body.category);
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});

fastify.delete("/categories", async (request, reply) => {
  let data = {};
  data.success = await db.delCategory(request.body.category);
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});



// 添加新的子类
fastify.post("/subcategories", async (request, reply) => {
  let data = {};
  data.success = await db.addSubcategory(request.body.category, request.body.user);
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});

// 获取给定主类的子类
fastify.get("/subcategories", async (request, reply) => {
  const subcategories = await db.getSubcategories(request.query.category);
  if (!subcategories) {
    reply.status(400).send(errorMessage);
  } else {
    reply.status(200).send(subcategories);
  }
});

fastify.delete("/subcategories", async (request, reply) => {
  let data = {};
  data.success = await db.delSubcategory(request.body.category, request.body.user);
  const status = data.success ? 200 : 400;
  reply.status(status).send(data);
});

// 添加漂流瓶
fastify.post("/bottle", async (request, reply) => {
  let data = {};
  data.success = await db.addBottle(request.body.message);
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});

// 获取漂流瓶
fastify.get("/bottle", async (request, reply) => {
  let bottle = {};
  bottle = await db.pickBottle();
  const status = bottle ? 200 : 400;
  reply.status(status).send(bottle);
});

//以下部分为web端API

// 搜索消息
fastify.get("/searchMessage", async (request, reply) => {
  let data = {};
  data.messages = await db.searchMessage(request.query.word);
  if (!data.messages) {
    data.error = errorMessage;
  }
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

// 添加新问题
fastify.post("/addQuestion", async (request, reply) => {
  let data = {};
  data.success = await db.addQuestion(request.body.sender, request.body.question, request.body.degree);
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});

// 获取/更新/删除问题
fastify.post("/handleQuestion", async (request, reply) => {
  let data = {};
  if (request.body.method === 'GET') {
    data.question = await db.handleQuestion('GET', request.body.question);
  } else if (request.body.method === 'POST') {
    data.success = await db.handleQuestion('POST', request.body.question, request.body.solution, request.body.solver);
  } else if (request.body.method === 'DELETE') {
    data.success = await db.handleQuestion('DELETE', request.body.question);
  }
  if (!data.question && !data.success) {
    data.error = errorMessage;
  }
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

// 获取反馈
fastify.get("/getFeedback", async (request, reply) => {
  let data = {};
  data.feedback = await db.getFeedback(request.query.solution, request.query.sender);
  if (!data.feedback) {
    data.error = errorMessage;
  }
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

// 搜索密语
fastify.get("/searchSecret", async (request, reply) => {
  let data = {};
  data.secret = await db.searchSecret(request.query.seek);
  if (!data.secret) {
    data.error = errorMessage;
  }
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});

// 添加留言
fastify.post("/addMessageToWall", async (request, reply) => {
  let data = {};
  data.success = await db.addMessageToWall(request.body.userName, request.body.time, request.body.text);
  const status = data.success ? 201 : 400;
  reply.status(status).send(data);
});

// 获取所有留言
fastify.get("/wall", async (request, reply) => {
  let data = {};
  data.messages = await db.getAllMessagesFromWall();
  if (!data.messages) {
    data.error = errorMessage;
  }
  const status = data.error ? 400 : 200;
  reply.status(status).send(data);
});
