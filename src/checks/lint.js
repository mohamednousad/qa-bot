const { ESLint } = require('eslint');
const path = require('path');

async function runLint(dir) {
  // Use the config file we created earlier
  const eslint = new ESLint({ 
    overrideConfigFile: path.join(process.cwd(), 'config', '.eslintrc.json'),
    useEslintrc: false
  });

  // Lint all JS files in the downloaded folder
  const results = await eslint.lintFiles([path.join(dir, '**/*.js')]);
  
  let errors = [];
  
  results.forEach(result => {
    result.messages.forEach(msg => {
      errors.push({
        path: path.relative(dir, result.filePath), // Make path relative for GitHub
        start_line: msg.line,
        end_line: msg.line,
        annotation_level: msg.severity === 2 ? 'failure' : 'warning',
        message: `[${msg.ruleId}] ${msg.message}`
      });
    });
  });

  return errors;
}

module.exports = runLint;