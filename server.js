const fs = require('fs');
const path = require('path');

// 获取当前文件所在目录的绝对路径
const dirPath = __dirname;

// 定义要写入的文件的路径
const filePath = path.join('/home/data', 'dirPath.txt');

// 将目录路径写入文件
fs.writeFile(filePath, dirPath, (err) => {
  if (err) {
    console.error('写入文件时发生错误:', err);
  } else {
    console.log(`目录路径已成功写入到文件: ${filePath}`);
  }
});
