import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { GaxiosOptions, GaxiosResponse } from "gaxios";
import { JWT as GoogleJWTClient } from "google-auth-library";
import { JSDOM } from "jsdom";
import * as _ from "lodash";

export interface Site {
  domain: string;
  name: string;
  updatedAt: Date;
  title: string;
  url: string;
}

export interface Feed {
  updatedAt: Date;
  entries: FeedEntry[];
}

export interface FeedEntry {
  id: string;
  category: string;
  updatedAt: Date;
  title: string;
  summary: {
    text: string;
    html: string;
  };
}

export class GoogleSitesLegacy {
  private readonly jwtClient?: GoogleJWTClient;

  constructor(
    serviceAccount?: {
      email: string; // service account email address
      delegatedUserEmail?: string; // impersonated account's email address
      privateKey: string;
    },
  ) {
    if (serviceAccount) {
      this.jwtClient = new GoogleJWTClient({
        email: serviceAccount.email,
        key: serviceAccount.privateKey,
        scopes: ["https://sites.google.com/feeds/"],
        subject: serviceAccount.delegatedUserEmail,
      });
    }
  }

  public async describe(domainName: string, siteName: string): Promise<Site> {
    const res = await this.request<string>({
      url: `https://sites.google.com/feeds/site/${domainName}/${siteName}`,
    });

    const dom = new JSDOM(res.data, {
      contentType: res.headers["content-type"] || "text/xml",
    });

    const id = dom.window.document.querySelector("entry > id")!.textContent!;
    const [ domain, name ] = id.split("/").slice(-2);
    const updated = dom.window.document.querySelector("entry > updated")!.textContent!;
    const title = dom.window.document.querySelector("entry > title")!.textContent!;
    const url = dom.window.document.querySelector("entry > link[type='text/html']")!.getAttribute("href")!;

    return {
      domain,
      name,
      updatedAt: new Date(updated),
      title,
      url,
    };
  }

  public async getActivityFeed(domainName: string, siteName: string): Promise<Feed> {
    const res = await this.request<string>({
      url: `https://sites.google.com/feeds/activity/${domainName}/${siteName}`,
    });

    const dom = new JSDOM(res.data, {
      contentType: res.headers["content-type"] || "text/xml",
    });

    // Currently JSDOM has a bug of `:scope` support
    const feedEl = dom.window.document.querySelector("feed")!;
    const feedUpdated = feedEl.querySelector("feed > updated")!.textContent!;

    const entriesEl = feedEl.querySelectorAll("feed > entry");
    const entries: FeedEntry[] = Array.from(entriesEl).map((entryEl) => {
      const id = entryEl.querySelector("id")!.textContent!;
      const updated = entryEl.querySelector("updated")!.textContent!;
      const category = entryEl.querySelector("category")!.getAttribute("label")!;
      const title = entryEl.querySelector("title")!.textContent!;
      const summaryEl = entryEl.querySelector("summary")!;

      return {
        id,
        category,
        updatedAt: new Date(updated),
        title,
        summary: {
          html: summaryEl.innerHTML!,
          text: summaryEl.textContent!,
        },
      };
    });

    return {
      updatedAt: entries.length > 0 ?
        entries[0].updatedAt :
        new Date(feedUpdated),
      entries: _.sortBy(entries, (entry) => -entry.updatedAt.getTime()),
    };
  }

  private async request<T>(options: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    if (this.jwtClient) {
      await this.jwtClient.authorize();
      return (await this.jwtClient.request<T>(options as GaxiosOptions)) as AxiosResponse<T>;
    } else {
      return await axios(options);
    }
  }
}
