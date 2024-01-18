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
          "CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, userId INTEGER, FOREIGN KEY(userId) REFERENCES Users(id))"
        );
      }

      console.log(await db.all("SELECT * from Messages"));
    } catch (dbError) {
      console.error(dbError);
    }
  });

module.exports = {

  // Add new user
  addUser: async (username, password) => {
    let success = false;
    try {
      success = await db.run("INSERT INTO Users (username, password) VALUES (?, ?)", [
        username,
        password
      ]);
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Check if a username is already taken
  checkUsername: async (username) => {
    let exists = false;
    try {
      const user = await db.get("SELECT * FROM Users WHERE username = ?", username);
      exists = user ? true : false;
    } catch (dbError) {
      console.error(dbError);
    }
    return exists;
  },

  // Add new message
  addMessage: async (message, username) => {
    let success = false;
    try {
      const user = await db.get("SELECT id FROM Users WHERE username = ?", username);
      if (user) {
        success = await db.run("INSERT INTO Messages (message, userId) VALUES (?, ?)", [
          message,
          user.id
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
          return await db.all("SELECT Messages.id, Messages.message, Users.username FROM Messages INNER JOIN Users ON Messages.userId = Users.id WHERE userId = ?", user.id);
        }
      } else {
        return await db.all("SELECT Messages.id, Messages.message, Users.username FROM Messages INNER JOIN Users ON Messages.userId = Users.id");
      }
    } catch (dbError) {
      console.error(dbError);
    }
  },

};
