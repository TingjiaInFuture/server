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
          "CREATE TABLE Users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, avatar BLOB DEFAULT NULL, experience INTEGER DEFAULT 0)"
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
        await db.run(
          "CREATE TABLE Bottles (id INTEGER PRIMARY KEY AUTOINCREMENT, message TEXT)"
        );
        //以下为web端
        // 问题表
        await db.run(
          "CREATE TABLE Questions (id INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT, question TEXT, degree INTEGER, solution TEXT, solver TEXT)"
        );

        // 密语表
        await db.run(
          "CREATE TABLE Secrets (id INTEGER PRIMARY KEY AUTOINCREMENT, secret TEXT)"
        );

        // 留言墙表
        await db.run(
          "CREATE TABLE Walls (id INTEGER PRIMARY KEY AUTOINCREMENT, userName TEXT, time TEXT, text TEXT)"
        );



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



  // Upload avatar
  uploadAvatar: async (userId, avatar) => {
    try {
      await db.run("UPDATE Users SET avatar = ? WHERE id = ?", [avatar, userId]);
    } catch (dbError) {
      console.error(dbError);
    }
  },

  // Get avatar
  getAvatar: async (userId) => {
    let avatar = null;
    try {
      const user = await db.get("SELECT avatar FROM Users WHERE id = ?", userId);
      if (user) {
        avatar = user.avatar;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return avatar;
  },

  // Add experience
  addExperience: async (userId, experience) => {
    try {
      await db.run("UPDATE Users SET experience = experience + ? WHERE id = ?", [experience, userId]);
    } catch (dbError) {
      console.error(dbError);
    }
  },

  // Get experience
  getExperience: async (userId) => {
    let experience = 0;
    try {
      const user = await db.get("SELECT experience FROM Users WHERE id = ?", userId);
      if (user) {
        experience = user.experience;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return experience;
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


  // 删除给定的主类
  delCategory: async (category) => {
    let success = false;
    try {
      const result = await db.run("DELETE FROM Categories WHERE category = ?", category);
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

  // 删除给定主类下的一个子类
  delSubcategory: async (category, user) => {
    let success = false;
    try {
      const result = await db.run("DELETE FROM Subcategories WHERE category = ? AND user = ?", category, user);
      success = result.changes > 0;
    } catch (dbError) {
      console.error(dbError);
    }
    return success;
  },

  // 扔出漂流瓶
  addBottle: async (message) => {
    let bottleId = 0;
    try {
      const result = await db.run("INSERT INTO Bottles (message) VALUES (?)", message);
      if (result.changes > 0) {
        const bottle = await db.get("SELECT last_insert_rowid() as id");
        bottleId = bottle.id;
      }
    } catch (dbError) {
      console.error(dbError);
    }
    return bottleId;
  },

  // 捡到漂流瓶
  pickBottle: async () => {
    let bottle = null;
    try {
      const bottles = await db.all("SELECT * FROM Bottles");
      const randomIndex = Math.floor(Math.random() * bottles.length);
      bottle = bottles[randomIndex];
    } catch (dbError) {
      console.error(dbError);
    }
    return bottle;
  },

  //以下为web端API
  // 搜索消息
  searchMessage: async (word) => {
    try {
      return await db.get(`SELECT * FROM Messages WHERE message LIKE ?`, `%${word}%`);
    } catch (error) {
      console.error(error);
    }
  },

  // 添加新问题
  addQuestion: async (sender, question, degree) => {
    try {
      return await db.run(`INSERT INTO Questions (sender, question, degree) VALUES (?, ?, ?)`, [sender, question, degree]);
    } catch (error) {
      console.error(error);
    }
  },

  // 获取/更新/删除问题
  handleQuestion: async (method, question, solution, solver) => {
    try {
      if (method === 'GET') {
        return await db.get(`SELECT * FROM Questions WHERE question = ?`, question);
      } else if (method === 'POST') {
        return await db.run(`UPDATE Questions SET solution = ?, solver = ? WHERE question = ?`, [solution, solver, question]);
      } else if (method === 'DELETE') {
        return await db.run(`DELETE FROM Questions WHERE question = ?`, question);
      }
    } catch (error) {
      console.error(error);
    }
  },

  // 获取反馈
  getFeedback: async (solution, sender) => {
    try {
      return await db.get(`SELECT * FROM Questions WHERE solution = ? AND sender = ?`, [solution, sender]);
    } catch (error) {
      console.error(error);
    }
  },

  // 搜索密语
  searchSecret: async (seek) => {
    try {
      return await db.get(`SELECT * FROM Secrets WHERE secret = ?`, seek);
    } catch (error) {
      console.error(error);
    }
  },

  // 添加留言
  addMessageToWall: async (userName, time, text) => {
    try {
      return await db.run(`INSERT INTO Walls (userName, time, text) VALUES (?, ?, ?)`, [userName, time, text]);
    } catch (error) {
      console.error(error);
    }
  },

  // 获取所有留言
  getAllMessagesFromWall: async () => {
    try {
      return await db.all(`SELECT * FROM Walls`);
    } catch (error) {
      console.error(error);
    }
  }


};
