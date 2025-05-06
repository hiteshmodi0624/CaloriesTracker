# CaloriesTracker

A mobile app to track your meals and calories using OpenAI to analyze food and calculate nutritional information.

## Features

- Upload photos of meals for automatic calorie calculation
- Create custom meals by adding ingredients
- Add custom ingredients with nutritional information
- Extract nutrition information from food labels
- View progress dashboard with daily calorie tracking

## Security Setup for OpenAI API Key

To use this app, you'll need an OpenAI API key. For security reasons, we don't hardcode this in the repository.

### Option 1: Using the Setup Script (Recommended)

1. Run the setup script:
   ```
   npm run setup-env
   ```

2. Enter your OpenAI API key when prompted

3. The script will generate a `.env` file that's automatically ignored by git

### Option 2: Manual Setup

1. Create a `.env` file in the project root with:
   ```
   OPENAI_API_KEY=your_actual_openai_key_here
   ```

2. Make sure not to commit this file to version control

## Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/CaloriesTracker.git
   cd CaloriesTracker
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up your environment variables using one of the options above

4. Start the app
   ```
   npm start
   ```

## Important Security Notes

- Your OpenAI API key is sensitive information - never commit it to version control
- The `.env` file is listed in `.gitignore` to prevent accidental commits
- If working in a team, each developer should set up their own `.env` file locally 