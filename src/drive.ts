import { env } from './env'

const CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID
const API_KEY = env.VITE_GOOGLE_API_KEY
const USE_FAKE = env.VITE_USE_FAKE_DRIVE

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

let tokenClient: any
let gapiInited = false
let gisInited = false

// --- FAKE DRIVE IMPLEMENTATION ---
const FAKE_STORAGE_KEY = 'void_fake_drive_v1'

type FakeFile = {
  id: string
  name: string
  mimeType: string
  parentId: string
  content?: string
  trashed?: boolean
}

const getFakeData = (): FakeFile[] => {
  const data = localStorage.getItem(FAKE_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

const saveFakeData = (data: FakeFile[]) => {
  localStorage.setItem(FAKE_STORAGE_KEY, JSON.stringify(data))
}

// --- API FUNCTIONS ---

export const initDriveApi = (onReady: () => void) => {
  if (USE_FAKE) {
    console.log('Using Fake Drive Integration')
    setTimeout(onReady, 500)
    return
  }

  if (!CLIENT_ID || !API_KEY) {
    console.error('Google Credentials missing in .env.local')
    return
  }

  const checkGapi = setInterval(() => {
    // @ts-ignore
    if (window.gapi && window.google) {
      clearInterval(checkGapi)
      
      // @ts-ignore
      window.gapi.load('client', async () => {
        // @ts-ignore
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        })
        gapiInited = true
        maybeReady()
      })

      // @ts-ignore
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '' // Defined later
      })
      gisInited = true
      maybeReady()
    }
  }, 100)

  const maybeReady = () => {
    if (gapiInited && gisInited) {
      onReady()
    }
  }
}

export const checkIsAuthenticated = () => {
  if (USE_FAKE) return true
  // @ts-ignore
  return window.gapi?.client?.getToken() !== null
}

export const loginToDrive = (onSuccess: () => void) => {
  if (USE_FAKE) {
    onSuccess()
    return
  }
  tokenClient.callback = (resp: any) => {
    if (resp.error !== undefined) {
      console.error(resp)
      return
    }
    onSuccess()
  }
  // @ts-ignore
  if (window.gapi.client.getToken() === null) {
    tokenClient.requestAccessToken({prompt: 'consent'})
  } else {
    tokenClient.requestAccessToken({prompt: ''})
  }
}

export const authenticateAndRun = (action: () => void) => {
  if (USE_FAKE || checkIsAuthenticated()) {
    action()
  } else {
    loginToDrive(action)
  }
}

export type DriveFile = {
  id: string
  name: string
  mimeType: string
}

export const listFilesAndFolders = async (parentId: string = 'root') => {
  if (USE_FAKE) {
    const files = getFakeData().filter(f => f.parentId === parentId && !f.trashed)
    return files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType }))
  }

  return new Promise<DriveFile[]>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        // @ts-ignore
        const response = await window.gapi.client.drive.files.list({
          q: `'${parentId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.folder' or mimeType='application/json')`,
          fields: 'files(id, name, mimeType)',
          spaces: 'drive',
          orderBy: 'folder, name'
        })
        resolve(response.result.files || [])
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

export const createFolder = async (folderName: string, parentId: string = 'root') => {
  if (USE_FAKE) {
    const data = getFakeData()
    data.push({
      id: 'folder_' + Math.random().toString(36).substr(2, 9),
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parentId
    })
    saveFakeData(data)
    return
  }

  return new Promise<void>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        const metadata = {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId]
        }
        await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          // @ts-ignore
          headers: new Headers({ 
            // @ts-ignore
            'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(metadata),
        })
        resolve()
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

export const saveBoardToDrive = async (fileName: string, data: any, parentId: string = 'root') => {
  if (USE_FAKE) {
    const allData = getFakeData()
    const existingIndex = allData.findIndex(f => f.name === fileName && f.parentId === parentId && !f.trashed)
    
    if (existingIndex > -1) {
      allData[existingIndex].content = JSON.stringify(data)
    } else {
      allData.push({
        id: 'file_' + Math.random().toString(36).substr(2, 9),
        name: fileName,
        mimeType: 'application/json',
        parentId,
        content: JSON.stringify(data)
      })
    }
    saveFakeData(allData)
    return
  }

  return new Promise<void>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        const fileContent = JSON.stringify(data)
        const file = new Blob([fileContent], { type: 'application/json' })
        
        // @ts-ignore
        const searchRes = await window.gapi.client.drive.files.list({
          q: `name='${fileName}' and '${parentId}' in parents and mimeType='application/json' and trashed=false`,
          spaces: 'drive',
        })
        const files = searchRes.result.files

        if (files && files.length > 0) {
          const metadata = { name: fileName, mimeType: 'application/json' }
          const form = new FormData()
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
          form.append('file', file)
          
          const fileId = files[0].id
          await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`, {
            method: 'PATCH',
            // @ts-ignore
            headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }),
            body: form,
          })
        } else {
          const metadata = { name: fileName, mimeType: 'application/json', parents: [parentId] }
          const form = new FormData()
          form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
          form.append('file', file)

          await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            // @ts-ignore
            headers: new Headers({ 'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token }),
            body: form,
          })
        }
        resolve()
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

export const loadBoardFromDriveId = async (fileId: string) => {
  if (USE_FAKE) {
    const file = getFakeData().find(f => f.id === fileId)
    return file ? JSON.parse(file.content || '{}') : {}
  }

  return new Promise<any>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        // @ts-ignore
        const fileRes = await window.gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media'
        })
        resolve(fileRes.result)
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

export const deleteFile = async (fileId: string) => {
  if (USE_FAKE) {
    const data = getFakeData()
    const index = data.findIndex(f => f.id === fileId)
    if (index > -1) {
      data[index].trashed = true
      saveFakeData(data)
    }
    return
  }

  return new Promise<void>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'PATCH',
          // @ts-ignore
          headers: new Headers({ 
            // @ts-ignore
            'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token,
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({ trashed: true }),
        })
        resolve()
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}

export const moveFile = async (fileId: string, currentParentId: string, newParentId: string) => {
  if (USE_FAKE) {
    const data = getFakeData()
    const index = data.findIndex(f => f.id === fileId)
    if (index > -1) {
      data[index].parentId = newParentId
      saveFakeData(data)
    }
    return
  }

  return new Promise<void>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentId}&removeParents=${currentParentId}`, {
          method: 'PATCH',
          // @ts-ignore
          headers: new Headers({ 
            // @ts-ignore
            'Authorization': 'Bearer ' + window.gapi.client.getToken().access_token
          })
        })
        resolve()
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  })
}
