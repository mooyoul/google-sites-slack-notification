import {
  Decorator,
  Query,
  Table,
} from "dynamo-types";

import * as Config from "../../config";

if (Config.store.type !== "dynamodb") {
  throw new Error("DynamoDB store is disabled in current configuration.");
}

if (!Config.store.tableName) {
  throw new Error("DynamoDB table name is missing in current configuration.");
}

@Decorator.Table({ name: Config.store.tableName })
export class State extends Table {
  @Decorator.HashPrimaryKey("id")
  public static readonly primaryKey: Query.HashPrimaryKey<State, string>;

  @Decorator.Writer()
  public static readonly writer: Query.Writer<State>;

  @Decorator.Attribute({ name: "id" })
  public id: string;

  @Decorator.Attribute({ name: "d" })
  public data: { [key: string]: any };
}
