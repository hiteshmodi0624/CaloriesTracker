import Constants from 'expo-constants';

// Load environment variables
const getEnvVariable = (name: string): string => {

  console.log(Constants.expoConfig?.extra?.[name]);
  console.log(process.env[name],process.env);
  if (process.env[name]) {
    return process.env[name] as string;
  }
  if (Constants.expoConfig?.extra?.[name]) {
    return Constants.expoConfig.extra[name];
  }
  
  return '';
};

export const ENV = {
  EXPO_PUBLIC_OPENAI_API_KEY: getEnvVariable('EXPO_PUBLIC_OPENAI_API_KEY'),
};

// Validate that required variables are set
export const validateEnv = (): boolean => {
  const requiredVars = ['EXPO_PUBLIC_OPENAI_API_KEY'];
  
  for (const varName of requiredVars) {
    if (!ENV[varName as keyof typeof ENV]) {
      console.error(`Missing required environment variable: ${varName}`);
      return false;
    }
  }
  
  return true;
}; 