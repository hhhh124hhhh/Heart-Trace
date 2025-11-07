const fs = require('fs');
const path = require('path');

// 安全地删除目录或文件
function removePath(pathToRemove) {
  try {
    if (fs.existsSync(pathToRemove)) {
      const stats = fs.statSync(pathToRemove);
      const isDirectory = stats.isDirectory();
      fs.rmSync(pathToRemove, { recursive: isDirectory, force: true });
      console.log(`成功删除: ${pathToRemove}`);
    } else {
      console.log(`路径不存在: ${pathToRemove}`);
    }
  } catch (error) {
    console.error(`删除路径时出错: ${pathToRemove}`, error);
  }
}

// 执行清理
const pathsToRemove = [
  path.resolve(__dirname, '..', 'node_modules'),
  path.resolve(__dirname, '..', '.pnpm-store'),
  path.resolve(__dirname, '..', 'pnpm-lock.yaml')
];

pathsToRemove.forEach(removePath);
console.log('清理完成');