import Dexie, { Table } from "dexie";
import { ChatMapRoom, MessageType, SimpleUser } from "./types";

export class NetworkDatabase extends Dexie {
  messages!: Table<MessageType, string | number>;
  rooms!: Table<ChatMapRoom, string>;
  dms!: Table<SimpleUser, string>;

  constructor() {
    super("NetworkDatabase");
    this.version(1).stores({
      messages: "id, roomId, senderId, recipientId, createdAt, [roomId+createdAt]",
      rooms: "id, lastMessageTimestamp",
      dms: "id, lastMessageTimestamp"
    });
  }
}

export const db = new NetworkDatabase();
