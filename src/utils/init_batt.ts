import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { Alert, confirmAlert, getPreferenceValues } from "@raycast/api";

interface Preferences {
  customBattPath?: string;
}

// Check if a command exists in the system PATH
export function commandExists(command: string): boolean {
  // Sanitize command to prevent command injection
  if (!/^[a-zA-Z0-9_\-]+$/.test(command)) {
    return false;
  }
  try {
    execSync(`which ${command}`, { stdio: "ignore", shell: '/bin/bash' });
    return true;
  } catch (error) {
    return false;
  }
}

// Get the path to the batt CLI executable
export function battPath(): string {
  const preferences = getPreferenceValues<Preferences>();
  const customPath = preferences.customBattPath?.trim();

  // Enhanced PATH with common directories including Homebrew paths which is likely where batt is installed
  const customDirectories = "/opt/homebrew/bin:/usr/local/bin";
  process.env.PATH = `${customDirectories}:${process.env.PATH || ""}`;

  // If custom path is provided and exists, use it
  if (customPath && existsSync(customPath)) {
    return customPath;
  }

  // Try to get the exact path of batt
  try {
    // Try with 'which' command first
    const battPathFromWhich = execSync("which batt", { encoding: 'utf8' }).toString().trim();
    if (battPathFromWhich && existsSync(battPathFromWhich)) {
      return battPathFromWhich;
    }
  } catch (error) {
    // If 'which' fails, continue to other methods
    console.log("Failed to find batt with 'which' command");
  }

  // Check common Homebrew paths directly
  const commonPaths = [
    "/opt/homebrew/bin/batt",
    "/usr/local/bin/batt",
    "/usr/bin/batt"
  ];

  for (const path of commonPaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  // If we get here, batt wasn't found
  throw new Error("Batt CLI not found. Please install it or specify a custom path in preferences.");
}

// Display an alert to confirm batt CLI installation
export async function confirmAlertBatt(): Promise<boolean> {
  try {
    battPath(); // Will throw if batt is not found
    return true;
  } catch (error) {
    const options: Alert.Options = {
      title: "Batt CLI Not Found",
      message: "The batt CLI tool is required but was not found on your system.",
      primaryAction: {
        title: "Learn How to Install",
        onAction: () => {
          // Open the installation instructions or GitHub repo in browser
          // Replace with the actual URL for batt CLI
          // execSync("open https://github.com/user/batt-cli");
        },
      },
      dismissAction: {
        title: "Cancel",
      },
    };

    return await confirmAlert(options);
  }
} 