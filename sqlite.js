const fs = require("fs");
let i = 1; // 添加一个全局变量i
while(fs.existsSync(`./data/chat${i}.db`)) { // 检查文件是否存在
    i++; // 如果存在，就递增i
}
const dbFile = `./data/chat${i}.db`; // 使用新的文件名
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
          "CREATE TABLE Messages (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT, user TEXT)"
        );
          await db.run(
              "INSERT INTO Messages (message, user) VALUES (?, ?)",
              "消息",
              "用户" 
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
