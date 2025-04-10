import { showHUD, Form, ActionPanel, Action, getPreferenceValues } from "@raycast/api";
import { setBatteryLimit } from "./utils/batt_utils";

interface CommandForm {
  limit: string;
}

export default function Command() {
  async function handleSubmit(values: CommandForm) {
    try {
      const limit = parseInt(values.limit, 10);
      if (isNaN(limit) || limit < 0 || limit > 100) {
        await showHUD("Error: Limit must be a number between 0 and 100");
        return;
      }
      
      await setBatteryLimit(limit);
      await showHUD(`Battery charge limit set to ${limit}%`);
    } catch (error) {
      console.error("Error setting battery limit:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      await showHUD(`Error: ${errorMessage}`);
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Set Limit" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="limit"
        title="Charge Limit"
        placeholder="Enter a value between 0 and 100"
        info="Set the maximum battery charge limit as a percentage"
        defaultValue="80"
        required
        autoFocus
      />
    </Form>
  );
}
