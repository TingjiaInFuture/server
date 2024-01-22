const fs = require("fs");
const dbFile = `/home/data/milin.db`; 
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");

// const crypto = require('crypto');
// // 生成随机的盐
// const salt = crypto.randomBytes(16).toString('hex');
// // 使用 pbkdf2Sync 函数对密码进行加密
// const hash = crypto.pbkdf2Sync('password', salt, 1000, 64, 'sha512').toString('hex');
// // 保存盐和 hash 值，盐的存储需要密匙保护

// //待解密的密码
// const encryptedPassword = 'password';
// // 使用 pbkdf2Sync 函数对密码进行解密
// const originalPassword = crypto.pbkdf2Sync(encryptedPassword, salt, 1000, 64, digest).toString('hex');



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
        await db.run(
          "CREATE TABLE Categories (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT)"
        );
        await db.run(
          "CREATE TABLE Subcategories (id INTEGER PRIMARY KEY AUTOINCREMENT, category TEXT, user TEXT)"
        );//不能使用并查集实现父子类，子类的父类是不确定的，所以只能使用两个表来实现
      }


      console.log(await db.all("SELECT * from Messages"));
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Check if a username is already taken
const checkUsername = async (username) => {
  let userId = 0;
  try {
    const user = await db.get("SELECT * FROM Users WHERE username = ?", username);
    userId = user ? user.id : 0;
  } catch (dbError) {
    console.error(dbError);
  }
  return userId;
};

module.exports = {
  checkUsername,

  // Add new user
  addUser: async (username, password) => {
    let userId = 0;
    try {
      // 检查用户名是否已存在
      userId = await checkUsername(username);
      if (!userId) {
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



  // 获取所有的类别
  getCategories: async () => {
    try {
      const categories = await db.all("SELECT * FROM Categories");
      return categories.map(category => category.category);
    } catch (dbError) {
      console.error(dbError);
    }
  },

  // 添加新的类别
  addCategory: async (category) => {
    let success = false;
    try {
      const result = await db.run("INSERT INTO Categories (category) VALUES (?)", category);
      success = result.changes > 0;
    } catch (dbError) {
      console.error(dbError);
    }
    return success;
  },

  // 添加新的子类
  addSubcategory: async (category, user) => {
    let success = false;
    try {
      const result = await db.run("INSERT INTO Subcategories (category, user) VALUES (?, ?)", category, user);
      success = result.changes > 0;
    } catch (dbError) {
      console.error(dbError);
    }
    return success;
  },

  // 获取给定主类的子类
  getSubcategories: async (category) => {
    try {
      const subcategories = await db.all("SELECT * FROM Subcategories WHERE category = ?", category);
      return subcategories.map(subcategory => subcategory.user);
    } catch (dbError) {
      console.error(dbError);
    }
  },

};
