#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE_PATH = path.join(__dirname, '../.env');

console.log('🔐 Setting up secure environment variables for CaloriesTracker');

rl.question('Enter your OpenAI API key: ', (openaiKey) => {
  if (!openaiKey) {
    console.error('❌ OpenAI API key is required!');
    rl.close();
    return;
  }

  const envContent = `# CaloriesTracker Environment Variables
# Generated on ${new Date().toISOString()}
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

OPENAI_API_KEY=${openaiKey}
`;

  fs.writeFileSync(ENV_FILE_PATH, envContent);
  console.log('✅ .env file created successfully!');
  console.log(`📁 Created at: ${ENV_FILE_PATH}`);
  console.log('🔒 Remember not to commit this file to version control!');
  
  rl.close();
}); 