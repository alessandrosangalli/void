import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveBoardToDrive,
  loadBoardFromDriveId,
  listFilesAndFolders,
  createFolder,
  deleteFile,
  moveFile,
} from '../drive'

/**
 * These tests exercise the Fake Drive (localStorage) implementation.
 * The real Google Drive API is never called — VITE_USE_FAKE_DRIVE=true.
 */

// Ensure we use the fake drive
beforeEach(() => {
  localStorage.clear()
})

describe('Fake Drive — Board CRUD', () => {
  it('saves and loads a board roundtrip', async () => {
    const board = {
      strokes: [
        [
          [10, 20, 0.5],
          [30, 40, 0.6],
        ] as [number, number, number][],
      ],
      texts: [{ id: 't1', x: 100, y: 200, content: 'hello', isEditing: false }],
      images: [],
      camera: { x: 50, y: 60, zoom: 1.5 },
    }

    await saveBoardToDrive('test.void', board, 'root')
    const files = await listFilesAndFolders('root')
    const file = files.find((f) => f.name === 'test.void')
    expect(file).toBeDefined()

    const loaded = await loadBoardFromDriveId(file!.id)
    expect(loaded.strokes).toEqual(board.strokes)
    expect(loaded.texts).toEqual(board.texts)
    expect(loaded.camera).toEqual(board.camera)
  })

  it('overwrites existing file with same name', async () => {
    await saveBoardToDrive('my.void', { v: 1 }, 'root')
    await saveBoardToDrive('my.void', { v: 2 }, 'root')

    const files = await listFilesAndFolders('root')
    const matches = files.filter((f) => f.name === 'my.void')
    expect(matches).toHaveLength(1)

    const loaded = await loadBoardFromDriveId(matches[0].id)
    expect(loaded.v).toBe(2)
  })

  it('saves files in different folders independently', async () => {
    await createFolder('Projects', 'root')
    const rootFiles = await listFilesAndFolders('root')
    const folder = rootFiles.find((f) => f.name === 'Projects')!

    await saveBoardToDrive('test.void', { v: 'root' }, 'root')
    await saveBoardToDrive('test.void', { v: 'proj' }, folder.id)

    const rootBoards = await listFilesAndFolders('root')
    const projBoards = await listFilesAndFolders(folder.id)
    expect(rootBoards.filter((f) => f.name === 'test.void')).toHaveLength(1)
    expect(projBoards.filter((f) => f.name === 'test.void')).toHaveLength(1)
  })
})

describe('Fake Drive — Folder CRUD', () => {
  it('creates a folder and lists it', async () => {
    await createFolder('Notes', 'root')
    const files = await listFilesAndFolders('root')
    const folder = files.find((f) => f.name === 'Notes')
    expect(folder).toBeDefined()
    expect(folder!.mimeType).toBe('application/vnd.google-apps.folder')
  })

  it('nested folders are scoped to parent', async () => {
    await createFolder('A', 'root')
    const rootFiles = await listFilesAndFolders('root')
    const folderA = rootFiles.find((f) => f.name === 'A')!

    await createFolder('B', folderA.id)
    const childFiles = await listFilesAndFolders(folderA.id)
    expect(childFiles.find((f) => f.name === 'B')).toBeDefined()

    // B should NOT appear in root
    const rootAgain = await listFilesAndFolders('root')
    expect(rootAgain.find((f) => f.name === 'B')).toBeUndefined()
  })
})

describe('Fake Drive — Delete (Trash)', () => {
  it('trashed file disappears from listing', async () => {
    await saveBoardToDrive('to-delete.void', { x: 1 }, 'root')
    let files = await listFilesAndFolders('root')
    const file = files.find((f) => f.name === 'to-delete.void')!

    await deleteFile(file.id)
    files = await listFilesAndFolders('root')
    expect(files.find((f) => f.name === 'to-delete.void')).toBeUndefined()
  })

  it('trashing is soft delete (data preserved in storage)', async () => {
    await saveBoardToDrive('soft.void', { data: 'important' }, 'root')
    const files = await listFilesAndFolders('root')
    const file = files.find((f) => f.name === 'soft.void')!

    await deleteFile(file.id)
    // Data still exists in localStorage, just flagged as trashed
    const raw = JSON.parse(localStorage.getItem('void_fake_drive_v1') || '[]')
    const trashed = raw.find(
      (f: { id: string; trashed?: boolean }) => f.id === file.id,
    )
    expect(trashed).toBeDefined()
    expect(trashed.trashed).toBe(true)
  })
})

describe('Fake Drive — Move', () => {
  it('moves a file to another folder', async () => {
    await createFolder('Destination', 'root')
    await saveBoardToDrive('movable.void', { x: 1 }, 'root')

    const rootFiles = await listFilesAndFolders('root')
    const dest = rootFiles.find((f) => f.name === 'Destination')!
    const file = rootFiles.find((f) => f.name === 'movable.void')!

    await moveFile(file.id, 'root', dest.id)

    const afterRoot = await listFilesAndFolders('root')
    expect(afterRoot.find((f) => f.name === 'movable.void')).toBeUndefined()

    const afterDest = await listFilesAndFolders(dest.id)
    expect(afterDest.find((f) => f.name === 'movable.void')).toBeDefined()
  })
})

describe('Fake Drive — Edge Cases', () => {
  it('loading nonexistent file returns empty object', async () => {
    const result = await loadBoardFromDriveId('nonexistent-id')
    expect(result).toEqual({})
  })

  it('empty folder listing returns empty array', async () => {
    const files = await listFilesAndFolders('root')
    expect(files).toEqual([])
  })

  it('deleting nonexistent file does not throw', async () => {
    await expect(deleteFile('fake-id')).resolves.toBeUndefined()
  })
})
