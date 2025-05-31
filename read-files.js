const fs = require('fs').promises;
const path = require('path');

async function getCsvFiles(directory) {
  const files = await fs.readdir(directory);
  return files.filter(file => path.extname(file).toLowerCase() === '.csv')
             .map(file => path.join(directory, file));
}