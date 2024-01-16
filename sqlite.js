/**
 * Module handles database management
 *
 * The sample data is for a chat log with one table:
 * Messages: id + message text
 */

const fs = require("fs");
const dbFile = "./data/chat.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
const casual = require("casual");
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
          "CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, user TEXT)"
        );
        for (let r = 0; r < 5; r++)
          await db.run(
              "INSERT INTO Messages (message, user) VALUES (?, ?)",
              casual.catch_phrase,
              casual.catch_phrase 
          );

      }

      console.log(await db.all("SELECT * from Messages"));
    } catch (dbError) {
      console.error(dbError);
    }
  });


// Server script calls these methods to connect to the db
module.exports = {
  
  // Get the messages in the database

  getMessages: async (userId = null) => {
    try {
      if (userId) {
        return await db.all("SELECT * from Messages WHERE user = ?", userId);
      } else {
        return await db.all("SELECT * from Messages");
      }
    } catch (dbError) {
      console.error(dbError);
    }
  },


  // Add new message
  addMessage: async (message, user) => {
    let success = false;
    try {
      success = await db.run("INSERT INTO Messages (message, user) VALUES (?, ?)", [
        message,
        user
      ]);
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Update message text
  updateMessage: async (id, message, user) => {
    let success = false;
    try {
      success = await db.run(
        "Update Messages SET message = ?, user = ? WHERE id = ?",
        message,
        user,
        id
      );
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  },

  // Remove message
  deleteMessage: async (id, user) => {
    let success = false;
    try {
      success = await db.run("Delete from Messages WHERE id = ? AND user = ?", id, user);
    } catch (dbError) {
      console.error(dbError);
    }
    return success.changes > 0 ? true : false;
  }

};
