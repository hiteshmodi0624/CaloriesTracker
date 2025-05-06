import Constants from 'expo-constants';

// Load environment variables
const getEnvVariable = (name: string): string => {
  // Use expo-constants first
  if (Constants.expoConfig?.extra?.[name]) {
    return Constants.expoConfig.extra[name];
  }
  
  // Fallback to process.env if available
  if (process.env[name]) {
    return process.env[name] as string;
  }
  
  return '';
};

export const ENV = {
  OPENAI_API_KEY: getEnvVariable('OPENAI_API_KEY'),
};

// Validate that required variables are set
export const validateEnv = (): boolean => {
  const requiredVars = ['OPENAI_API_KEY'];
  
  for (const varName of requiredVars) {
    if (!ENV[varName as keyof typeof ENV]) {
      console.error(`Missing required environment variable: ${varName}`);
      return false;
    }
  }
  
  return true;
}; 