import { ActionPanel, Detail, List, Action, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { getBatteryStatus } from "./utils/batt_utils";

export default function Command() {
  const [status, setStatus] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchBatteryStatus() {
    setIsLoading(true);
    try {
      const result = await getBatteryStatus();
      if (result && result.trim() !== "") {
        setStatus(result);
        setError(null);
      } else {
        throw new Error("Empty response received from batt command");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Battery status error:", errorMessage);
      setError(errorMessage);
      setStatus("Error fetching battery status");
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to get battery status",
        message: errorMessage.substring(0, 100)
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchBatteryStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBatteryStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format the battery status for better display in Raycast
  let formattedMarkdown;
  if (error) {
    formattedMarkdown = `# Error\n\n**Error Message:** ${error}\n\n## Troubleshooting\n\n1. Make sure the batt CLI is installed\n2. Try running \`batt status\` directly in Terminal\n3. Provide a custom path in extension preferences if needed`;
  } else {
    // Parse the status output to create a more readable format
    // First, break it into sections based on the status output
    const lines = status.split('\n').filter(line => line.trim() !== '');
    
    let formattedStatus = '';
    let currentSection = '';
    
    // Process each line to create a more structured layout
    for (const line of lines) {
      if (line.endsWith(':')) {
        // This is a section header
        currentSection = line;
        formattedStatus += `\n### ${line}\n`;
      } else if (line.trim().startsWith('-')) {
        // This is a bullet point
        formattedStatus += `- ${line.trim().substring(1).trim()}\n`;
      } else if (line.includes(':') && !line.endsWith(':')) {
        // This is a key-value pair
        const [key, value] = line.split(':').map(part => part.trim());
        formattedStatus += `**${key}:** ${value}\n`;
      } else {
        // Regular line
        formattedStatus += `${line}\n`;
      }
    }
    
    formattedMarkdown = `# Battery Status\n\n${formattedStatus}`;
  }

  return (
    <Detail
      markdown={formattedMarkdown}
      isLoading={isLoading}
      navigationTitle="Battery Status"
      actions={
        <ActionPanel>
          <Action
            title="Refresh"
            icon={Icon.ArrowClockwise}
            onAction={fetchBatteryStatus}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />
        </ActionPanel>
      }
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Command" text="batt status" />
          {error && (
            <Detail.Metadata.TagList title="Status">
              <Detail.Metadata.TagList.Item text="Error" color="#FF0000" />
            </Detail.Metadata.TagList>
          )}
        </Detail.Metadata>
      }
    />
  );
}
