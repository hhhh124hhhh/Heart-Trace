const fs = require('fs');
const path = require('path');

// 安全地删除目录
function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`成功删除目录: ${dirPath}`);
    } else {
      console.log(`目录不存在: ${dirPath}`);
    }
  } catch (error) {
    console.error(`删除目录时出错: ${dirPath}`, error);
  }
}

// 执行清理
const viteTempPath = path.resolve(__dirname, '..', 'node_modules', '.vite-temp');
removeDirectory(viteTempPath);