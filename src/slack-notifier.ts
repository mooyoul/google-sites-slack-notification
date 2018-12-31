import axios from "axios";
import * as cheerio from "cheerio";
import * as html2text from "html-to-text";

import { FeedEntry, Site } from "./google-sites";

enum COLOR {
  GOOD = "228b22",
  GREY = "cccccc",
  ORANGE = "ff4e00",
}

export interface Field {
  title: string;
  value: string;
  short?: boolean;
}

export type Fields = Field[];

export interface Payload {
  text: string;
  attachments: Array<{
    color?: COLOR;
    fallback?: string; // for push notification
    pretext?: string; // inserted before fields
    fields?: Fields;
    text?: string;
  }>;
}

export class SlackNotifier {
  constructor(
    private endpointUrl: string,
  ) {}

  public async updated(site: Site, entries: FeedEntry[]) {
    if (entries.length > 0) {
      await this.notify({
        text: `*${site.title}* is updated! 🚀`,
        attachments: entries.map((entry) => ({
          color: COLOR.ORANGE,
          text: html2text.fromString(entry.summary.html, {
            format: {
              anchor(elem: any) { // cheerio.CheerIOElement
                const el = cheerio(elem);
                const text = el.text();
                const href = el.attr("href");

                return `<${href}|${text}>`;
              },
            },
          } as any),
        })),
      });
    }
  }

  public async notify(payload: Payload): Promise<void> {
    await axios.post(this.endpointUrl, JSON.stringify(payload));
  }
}
