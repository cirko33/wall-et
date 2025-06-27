import dotenv from "dotenv";

export interface Config {
  port: string;
}

const loadConfig = (): Config => {
  const result = dotenv.config();

  if (result.error) {
    throw new Error(`Failed to load .env file: ${result.error.message}`);
  }

  return {
    port: process.env.PORT || "3000",
  };
};

export default loadConfig;
