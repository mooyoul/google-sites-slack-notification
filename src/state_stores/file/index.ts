import { readFile, writeFile } from "fs";
import { platform } from "os";
import { join, resolve } from "path";

const HOME_PATH = process.env[platform() === "win32" ? "USERPROFILE" : "HOME"]! as string;

import { StateData, StateStoreBase } from "../base";

export class FileStateStore extends StateStoreBase {
  private readonly filePath: string;
  private locked: boolean = false;
  private stale: boolean = false;
  private cache?: Map<string, StateData>;

  public constructor(filePath: string) {
    super();
    this.filePath = this.resolvePath(filePath);
  }

  public async get(domainName: string, siteName: string) {
    await this.load();
    return this.cache!.get(this.getKey(domainName, siteName)) || null;
  }

  public async set(domainName: string, siteName: string, state: StateData) {
    await this.load();
    this.cache!.set(this.getKey(domainName, siteName), state);
    await this.save();
  }

  public async del(domainName: string, siteName: string) {
    await this.load();

    const key = this.getKey(domainName, siteName);
    if (this.cache!.has(key)) {
      await this.cache!.delete(key);
      await this.save();
    }
  }

  private async load() {
    if (!this.cache) {
      try {
        const saved = await new Promise<string>((resolve, reject) => {
          readFile(this.filePath, { encoding: "utf8"}, (e, data) => {
            if (e) { return reject(e); }

            resolve(data);
          });
        });

        this.cache = new Map<string, StateData>(JSON.parse(saved));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") {
          this.cache = new Map<string, StateData>();
          return;
        }

        throw e;
      }
    }
  }

  // @todo migrate to async-sema
  private async save() {
    if (this.locked) {
      this.stale = true;
      return;
    }

    this.locked = true;

    const flush = () => new Promise<void>((resolve, reject) => {
      writeFile(this.filePath, JSON.stringify(Array.from(this.cache!.entries())), (e) => {
        if (e) { return reject(e); }

        resolve();
      });
    });

    await flush();

    if (this.stale) {
      await flush();
      this.stale = false;
    }

    this.locked = false;
  }

  private resolvePath(path: string) {
    if (path === "~") { return HOME_PATH; }
    if (path.slice(0, 2) === "~/") { return join(HOME_PATH, path.slice(2)) }
    return resolve(path);
  }
}
