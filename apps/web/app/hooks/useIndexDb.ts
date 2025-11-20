import { useEffect, useState } from "react";

export function useIndexedDB(dbName: string, storeName: string) {
  const [db, setDb] = useState<IDBDatabase | null>(null);

  useEffect(() => {
    if (!window.indexedDB) {
      console.error("Your browser doesn't support IndexedDB");
      return;
    }

    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(storeName)) {
        database.createObjectStore(storeName, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => setDb(request.result);
    request.onerror = () => console.error("Failed to open DB", request.error);
  }, [dbName, storeName]);

  const add = (data: any) => {
    if (!db) return;
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    store.add(data);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  };

  const getAll = () => {
    if (!db) return;
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  };

  return { add, getAll };
}
