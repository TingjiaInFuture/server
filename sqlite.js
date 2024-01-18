const fs = require("fs");
const dbFile = `./data/milin.db`; // 使用新的文件名
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");

let db;

//SQLite wrapper for async / await connections https://www.npmjs.com/package/sqlite
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database
  })
  .then(async dBase => {
    db = dBase;

    try {
      if (!exists) {
        await db.run(
          "CREATE TABLE Users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)"
        );
        await db.run(
          "CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, senderId INTEGER, receiverId INTEGER, FOREIGN KEY(senderId) REFERENCES Users(id), FOREIGN KEY(receiverId) REFERENCES Users(id))"
        );
      }


      console.log(await db.all("SELECT * from Messages"));
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Check if a username is already taken
const checkUsername = async (username) => {
  let exists = false;
  try {
    const user = await db.get("SELECT * FROM Users WHERE username = ?", username);
    exists = user ? true : false;
  } catch (dbError) {
    console.error(dbError);
  }
  return exists;
};

module.exports = {
  checkUsername,

  // Add new user
  addUser: async (username, password) => {
    let userId = 0;
    try {
      // 检查用户名是否已存在
      const usernameExists = await checkUsername(username);
      if (!usernameExists) {
        const result = await db.run("INSERT INTO Users (username, password) VALUES (?, ?)", [
          username,
          password
        ]);
        if (result.changes > 0) {
          // 获取新插入的用户的 id
          const user = await db.get("SELECT last_insert_rowid() as id");
          userId = user.id;
        }
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return userId;
  },



  // 登录验证
  login: async (username, password) => {
    let userId = 0;
    try {
      const user = await db.get("SELECT * FROM Users WHERE username = ? AND password = ?", username, password);
      if (user) {
        userId = user.id;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return userId;
  },



  // Add new message
  addMessage: async (message, senderUsername, receiverUsername) => {
    let success = false;
    try {
      const sender = await db.get("SELECT id FROM Users WHERE username = ?", senderUsername);
      const receiver = await db.get("SELECT id FROM Users WHERE username = ?", receiverUsername);
      if (sender && receiver) {
        success = await db.run("INSERT INTO Messages (message, senderId, receiverId) VALUES (?, ?, ?)", [
          message,
          sender.id,
          receiver.id
        ]);
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Get the messages in the database
  getMessages: async (username = null) => {
    try {
      if (username) {
        const user = await db.get("SELECT id FROM Users WHERE username = ?", username);
        if (user) {
          return await db.all("SELECT Messages.id, Messages.message, sender.username as sender, receiver.username as receiver FROM Messages INNER JOIN Users as sender ON Messages.senderId = sender.id INNER JOIN Users as receiver ON Messages.receiverId = receiver.id WHERE senderId = ? OR receiverId = ?", user.id, user.id);
        }
      } else {
        return await db.all("SELECT Messages.id, Messages.message, sender.username as sender, receiver.username as receiver FROM Messages INNER JOIN Users as sender ON Messages.senderId = sender.id INNER JOIN Users as receiver ON Messages.receiverId = receiver.id");
      }
    } catch (dbError) {
      console.error(dbError);
    }
  },

};
