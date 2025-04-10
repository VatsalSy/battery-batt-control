import { ActionPanel, Detail, List, Action, Icon } from "@raycast/api";
import { useEffect, useState } from "react";
import { runAppleScript } from "@raycast/utils";

export default function Command() {
  const [status, setStatus] = useState<string>("Loading...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getBatteryStatus() {
      try {
        const result = await runAppleScript('do shell script "batt status"');
        setStatus(result);
      } catch (error) {
        setStatus("Error: Could not get battery status. Make sure 'batt' CLI is installed.");
      } finally {
        setIsLoading(false);
      }
    }

    getBatteryStatus();
  }, []);

  return (
    <Detail
      markdown={status}
      isLoading={isLoading}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Command" text="batt status" />
        </Detail.Metadata>
      }
    />
  );
}
