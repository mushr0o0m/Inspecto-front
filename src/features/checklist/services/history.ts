import type { Workspace } from '../types.ts'
export interface Revision {
  id: string
  createdAt: string
  reason: string
  workspace: Workspace
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('inspecto-documents', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('revisions', { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('История недоступна. Разрешите хранение данных в браузере.'))
  })
}
export async function archiveWorkspace(workspace: Workspace, reason: string) {
  const db = await database()
  const revision: Revision = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    reason,
    workspace: structuredClone(workspace),
  }
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('revisions', 'readwrite')
      tx.objectStore('revisions').add(revision)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(new Error('Не удалось записать версию. Проверьте свободное место.'))
      tx.onabort = () => reject(new Error('Запись версии прервана.'))
    })
  } finally {
    db.close()
  }
  return revision
}
export async function readHistory(): Promise<Revision[]> {
  const db = await database()
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction('revisions').objectStore('revisions').getAll()
      req.onsuccess = () => resolve((req.result as Revision[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
      req.onerror = () => reject(new Error('Не удалось прочитать историю.'))
    })
  } finally {
    db.close()
  }
}
