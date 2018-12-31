interface Config {
  logging?: boolean;
  store: ({
    type: "dynamodb";
    tableName: string;
  }) | ({
    type: "file";
    filePath: string;
  });
  account?: {
    credentials?: {
      client_email: string;
      private_key: string;
    };
    delegatedUserEmail?: string;
  };
  notification: {
    slack: {
      webhookUrl: string;
    };
  };
  sites: Site[];
}

interface Site {
  domain: string;
  name: string;
}

const config: Config = {
  logging: true,
  // Use below configuration if you want to use dynamodb as state store
  // also you can use `npm run dynamodb:migrate` to create dynamodb table
  //
  // store: {
  //   type: "dynamodb",
  //   tableName: "google_sites_sync_prod",
  // },
  store: {
    type: "file",
    filePath: "/tmp/.google-sites-sync-state",
  },

  // Optional
  account: {
    // Optional
    // If target sites is private, Setup service-account credentials here.
    //
    // credentials: require("./google-client-credential-0123456abcdef.json"), // tslint:disable-line

    // Optional
    // If given service account has domain-wide authority and wants to act as real g suite account.
    // Allow service account from G Suite Admin and set this value.
    // @see https://developers.google.com/identity/protocols/OAuth2ServiceAccount#delegatingauthority
    //
    // delegatedUserEmail: "mooyeol.lee@mycompany.com",
  },
  notification: {
    slack: {
      webhookUrl: "https://hooks.slack.com/services/..."
    },
  },
  sites: [
    // If site is not associated with G Suite, use `site` as domain.
    // For example:
    { domain: "site", name: "sitesnotificationdemo" },

    // If site is associated with G Suite, use G Suite domain as domain.
    // { domain: "mycompany.com", name: "awesome_product_design" },
  ],
};

export = config;
