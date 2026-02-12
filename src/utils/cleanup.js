const fs = require('fs-extra');

async function cleanup(dir) {
  console.log(`Cleaning up ${dir}...`);
  await fs.remove(dir);
}

module.exports = cleanup;