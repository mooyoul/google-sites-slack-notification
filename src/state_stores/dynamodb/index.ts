import { StateData, StateStoreBase } from "../base";

import { State } from "./model";

export class DynamoDBStateStore extends StateStoreBase {
  public async get(domainName: string, siteName: string) {
    const model = await State.primaryKey.get(this.getKey(domainName, siteName));
    if (!model) {
      return null;
    }

    return model.data as StateData;
  }

  public async set(domainName: string, siteName: string, state: StateData) {
    const model = new State();
    model.id = this.getKey(domainName, siteName);
    model.data = state;

    await model.save();
  }

  public async del(domainName: string, siteName: string) {
    await State.primaryKey.delete(this.getKey(domainName, siteName));
  }
}
