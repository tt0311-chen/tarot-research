const DB_NAME='tarot_research_private_v1';
const STORE='sessions';
const DB_VERSION=1;

export function openDB() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'id'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
    request.onblocked=()=>reject(new Error('資料庫被其他分頁佔用'));
  });
}
export async function dbPut(value) {
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(value);
    tx.oncomplete=()=>{db.close();resolve();};
    tx.onerror=()=>{db.close();reject(tx.error);};
    tx.onabort=()=>{db.close();reject(tx.error||new Error('儲存中止'));};
  });
}
export async function dbAll() {
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const r=tx.objectStore(STORE).getAll();
    r.onsuccess=()=>resolve(r.result||[]);
    r.onerror=()=>reject(r.error);
    tx.oncomplete=()=>db.close();
  });
}
export async function dbGet(id) {
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const r=tx.objectStore(STORE).get(id);
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>reject(r.error);
    tx.oncomplete=()=>db.close();
  });
}
export async function dbInsertIfMissing(value) {
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    const store=tx.objectStore(STORE);
    const check=store.get(value.id);
    let inserted=false;
    check.onsuccess=()=>{ if(!check.result){store.add(value);inserted=true;} };
    tx.oncomplete=()=>{db.close();resolve(inserted);};
    tx.onerror=()=>{db.close();reject(tx.error);};
  });
}
