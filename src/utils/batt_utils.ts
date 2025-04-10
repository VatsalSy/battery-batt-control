import { execSync } from "child_process";
import { showHUD, getPreferenceValues } from "@raycast/api";
import { battPath, confirmAlertBatt } from "./init_batt";
import { existsSync } from "fs";

interface Preferences {
  customBattPath?: string;
}

/**
 * Execute a batt command with optional administrator privileges
 */
export async function executeBattCommand(
  command: string,
  requireAdmin = false,
  showOutput = true
): Promise<string> {
  try {
    // Check if batt is available first
    const battAvailable = await confirmAlertBatt();
    if (!battAvailable) {
      throw new Error("Batt CLI not available. Please install it or specify a custom path in preferences.");
    }

    const battCmd = battPath();
    console.log(`Using batt command path: ${battCmd}`);
    const fullCommand = `${battCmd} ${command}`;
    
    let output = "";
    
    try {
      if (requireAdmin) {
        // Execute with admin privileges using osascript
        const safeCommand = fullCommand.replace(/"/g, '\\"');
        const osaCommand = `/usr/bin/osascript -e 'do shell script "${safeCommand}" with prompt "Administrator Privileges Required" with administrator privileges'`;
        
        console.log(`Executing with admin (osascript): ${osaCommand}`);
        output = execSync(osaCommand, { 
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 // 1MB buffer
        }).toString().trim();
      } else {
        // Execute without admin privileges
        console.log(`Executing direct command: ${fullCommand}`);
        
        // Use a more direct approach
        try {
          output = execSync(fullCommand, { 
            encoding: 'utf8',
            env: { ...process.env, PATH: process.env.PATH || "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin" },
            maxBuffer: 1024 * 1024 // 1MB buffer
          }).toString().trim();
        } catch (directExecError: unknown) {
          // If direct command fails, try with sh -c
          const directError = directExecError instanceof Error ? directExecError : new Error(String(directExecError));
          console.log(`Direct command failed, trying with shell: ${directError.message}`);
          output = execSync(`/bin/sh -c "${fullCommand.replace(/"/g, '\\"')}"`, { 
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 // 1MB buffer
          }).toString().trim();
        }
      }
      
      if (showOutput) {
        await showHUD(`Command executed: ${command}`);
      }
      
      console.log(`Batt command output length: ${output.length}`);
      console.log(`Batt command output (first 100 chars): ${output.substring(0, 100)}`);
      
      return output;
    } catch (execError) {
      const errorMessage = execError instanceof Error ? execError.message : String(execError);
      console.error(`Error executing command "${fullCommand}": ${errorMessage}`);
      throw new Error(`Failed to execute batt command: ${errorMessage}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error executing batt command: ${errorMessage}`);
    if (showOutput) {
      await showHUD(`Error: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Get battery status
 */
export async function getBatteryStatus(): Promise<string> {
  try {
    // First attempt with our standard batt command
    try {
      const output = await executeBattCommand("status", false, false);
      if (output && output.trim() !== "") {
        return output;
      }
      console.log("executeBattCommand returned empty output, trying fallback methods");
    } catch (primaryError) {
      console.error("Primary batt command failed:", primaryError);
      // Continue to fallbacks
    }
    
    // Fallback 1: Direct invocation via shell
    try {
      console.log("Trying direct shell invocation");
      const path = process.env.PATH || "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin";
      const directOutput = execSync("PATH=" + path + " batt status", { 
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
      }).toString().trim();
      
      if (directOutput && directOutput.trim() !== "") {
        return directOutput;
      }
      console.log("Direct shell invocation returned empty output");
    } catch (fallbackError) {
      console.error("Fallback direct shell invocation failed:", fallbackError);
    }
    
    // Fallback 2: Try with absolute path if we can find it
    try {
      console.log("Trying with absolute path");
      // Try common locations
      const commonPaths = [
        "/opt/homebrew/bin/batt",
        "/usr/local/bin/batt",
        "/usr/bin/batt"
      ];
      
      for (const battPath of commonPaths) {
        if (existsSync(battPath)) {
          console.log(`Found batt at ${battPath}, trying to execute`);
          const absoluteOutput = execSync(`${battPath} status`, { 
            encoding: 'utf8',
            maxBuffer: 1024 * 1024
          }).toString().trim();
          
          if (absoluteOutput && absoluteOutput.trim() !== "") {
            return absoluteOutput;
          }
        }
      }
    } catch (absoluteError) {
      console.error("Fallback absolute path invocation failed:", absoluteError);
    }
    
    throw new Error("All attempts to get battery status failed");
  } catch (error) {
    console.error("Failed to get battery status after all attempts:", error);
    throw error;
  }
}

/**
 * Set battery charge limit
 */
export async function setBatteryLimit(limit: number): Promise<string> {
  try {
    if (limit < 0 || limit > 100) {
      throw new Error("Battery limit must be between 0 and 100");
    }
    
    return await executeBattCommand(`limit ${limit}`, true, true);
  } catch (error) {
    console.error(`Failed to set battery limit to ${limit}:`, error);
    throw error;
  }
}

/**
 * Disable battery optimization
 */
export async function disableBatteryOptimization(): Promise<string> {
  try {
    return await executeBattCommand("disable", true, true);
  } catch (error) {
    console.error("Failed to disable battery optimization:", error);
    throw error;
  }
} 