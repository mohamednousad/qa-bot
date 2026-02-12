const fs = require('fs-extra');
const path = require('path');

// Recursive function to get all files
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

async function checkStructure(dir) {
  const allFiles = getAllFiles(dir);
  let errors = [];

  allFiles.forEach(filePath => {
    const filename = path.basename(filePath);
    const relPath = path.relative(dir, filePath);

    // Rule 1: Models should be PascalCase (e.g., User.js)
    if (relPath.includes('models') && filename.endsWith('.js')) {
      if (!/^[A-Z]/.test(filename)) {
        errors.push({
          path: relPath,
          start_line: 1,
          end_line: 1,
          annotation_level: 'failure',
          message: 'Structure Check: Model files must start with an Uppercase letter (PascalCase).'
        });
      }
    }

    // Rule 2: Controllers/Routes should be camelCase (e.g., userController.js)
    if ((relPath.includes('controllers') || relPath.includes('routes')) && filename.endsWith('.js')) {
      if (!/^[a-z]/.test(filename)) {
        errors.push({
          path: relPath,
          start_line: 1,
          end_line: 1,
          annotation_level: 'failure',
          message: 'Structure Check: Controllers and Routes must start with a lowercase letter (camelCase).'
        });
      }
    }
  });

  return errors;
}

module.exports = checkStructure;