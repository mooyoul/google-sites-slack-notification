export interface StateData {
  lastItemId: string | null;
  lastUpdatedAt: number;
}

export abstract class StateStoreBase {
  public abstract get(domainName: string, siteName: string): Promise<StateData | null>;
  public abstract set(domainName: string, siteName: string, state: StateData): Promise<void>;
  public abstract del(domainName: string, siteName: string): Promise<void>;

  protected getKey(domainName: string, siteName: string) {
    return `${domainName}/${siteName}`;
  }
}
