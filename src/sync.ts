import * as debug from "debug";

import { GoogleSitesLegacy } from "./google-sites";
import { SlackNotifier } from "./slack-notifier";
import { StateStoreBase } from "./state_stores/base";

const isLambda = !!process.env.LAMBDA_TASK_ROOT;

import * as Config from "./config";

const log = debug("google-sites-slack-notification");
log.enabled = !!Config.logging;

const store: StateStoreBase = (() => {
  if (Config.store.type === "dynamodb") {
    const { DynamoDBStateStore } = require("./state_stores/dynamodb"); // tslint:disable-line
    return new DynamoDBStateStore();
  } else {
    const { FileStateStore } = require("./state_stores/file"); // tslint:disable-line
    if (isLambda) {
      log([
        "WARNING: Using FileStateStore in lambda environment will result unexpected behavior.",
        "Use DynamoDBStateStore instead.",
      ].join("\n"));
    }

    return new FileStateStore(Config.store.filePath);
  }
})();

const sites = (() => {
  if (Config.account && Config.account.credentials) {
    return new GoogleSitesLegacy({
      email: Config.account.credentials.client_email,
      privateKey: Config.account.credentials.private_key,
      delegatedUserEmail: Config.account.delegatedUserEmail,
    });
  }

  return new GoogleSitesLegacy();
})();

const slack = new SlackNotifier(Config.notification.slack.webhookUrl);

export const handler = async () => {
  for (const { domain, name } of Config.sites) {
    log("START %s / %s", domain, name);
    try {
      log("fetching saved state from store");
      const state = await store.get(domain, name);

      log("fetching activities from %s/%s", domain, name);
      await sites.describe(domain, name);
      const site = await sites.describe(domain, name);
      const feed = await sites.getActivityFeed(domain, name);

      if (state) {
        const index = feed.entries.findIndex((entry) => entry.id === state.lastItemId);

        const changes = index === -1 ?
          feed.entries :
          feed.entries.slice(0, index);

        log("detected %d changes", changes.length);
        await slack.updated(site, changes);
      } else {
        log("final state is missing. maybe first run?");
      }

      await store.set(domain, name, {
        lastUpdatedAt: feed.updatedAt.getTime(),
        lastItemId: feed.entries.length > 0 ?
          feed.entries[0].id :
          null,
      });
    } catch (e) {
      log("Failed to sync: ", e.stack);
    }

    log("END %s / %s", domain, name);
  }
};

if (!isLambda) {
  handler().catch(log);
}
