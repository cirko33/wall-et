import configFile from "./config.json";

export interface Config {
  RPC_URL: string;
  APPROVER_CONTRACT: string;
}

export const config: Config = getConfig();

export function getConfig() {
  return configFile;
}
