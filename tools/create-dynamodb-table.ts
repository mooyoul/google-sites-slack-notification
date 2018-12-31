import * as Config from "../src/config";
import { State } from "../src/state_stores/dynamodb/model";

// tslint:disable:no-console
(async () => {
  if (Config.store.type !== "dynamodb") {
    console.error("DynamoDB state store is disabled in current configuration. Please update src/config.ts to continue");
    process.exit(1);
    return;
  }

  console.log("creating table %s", Config.store.tableName);
  await State.createTable();

  console.log("done.");
})().catch(console.error);
// tslint:enable:no-console
