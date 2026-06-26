import { env } from './env'

const CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID
const API_KEY = env.VITE_GOOGLE_API_KEY
const USE_FAKE = env.VITE_USE_FAKE_DRIVE

const DISCOVERY_DOC =
  'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'
const SCOPES = 'https://www.googleapis.com/auth/drive.file'

let tokenClient: ReturnType<
  typeof window.google.accounts.oauth2.initTokenClient
> | null = null
let gapiInited = false
let gisInited = false

/** Returns the current access token or throws if not authenticated. */
const getAccessToken = (): string => {
  const token = window.gapi.client.getToken()
  if (!token) throw new Error('Not authenticated')
  return token.access_token
}

/** Returns auth headers for Google Drive API fetch calls. */
const authHeaders = (): Headers =>
  new Headers({ Authorization: `Bearer ${getAccessToken()}` })

/** Returns auth headers with JSON content type. */
const authJsonHeaders = (): Headers =>
  new Headers({
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
  })

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

export const isTokenExpired = (): boolean => {
  if (USE_FAKE) return false
  const savedTokenStr = localStorage.getItem('void_google_token')
  if (!savedTokenStr) return true
  try {
    const savedToken = JSON.parse(savedTokenStr)
    if (!savedToken || !savedToken.access_token || !savedToken.expires_at)
      return true
    return savedToken.expires_at <= Date.now() + 10000 // 10s buffer
  } catch {
    return true
  }
}

let onAuthExpiredCallback: (() => void) | null = null

export const registerAuthExpiredCallback = (callback: () => void) => {
  onAuthExpiredCallback = callback
}

export const triggerAuthExpired = () => {
  if (onAuthExpiredCallback) {
    onAuthExpiredCallback()
  }
}

export const handleDriveError = (error: unknown) => {
  console.error('Google Drive API error:', error)
  if (error && typeof error === 'object') {
    const err = error as {
      status?: number
      result?: { error?: { code?: number } }
      message?: string
    }
    const is401 =
      err.status === 401 ||
      err.result?.error?.code === 401 ||
      err.message?.includes('401')
    if (is401) {
      triggerAuthExpired()
    }
  }
}

const handleFetchResponse = async (res: Response): Promise<Response> => {
  if (!res.ok) {
    if (res.status === 401) {
      triggerAuthExpired()
      throw new Error('Google Drive session expired')
    }
    const errText = await res.text()
    throw new Error(`Google Drive API error (${res.status}): ${errText}`)
  }
  return res
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
    if (window.gapi && window.google) {
      clearInterval(checkGapi)

      window.gapi.load('client', async () => {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        })

        // Restore token from localStorage if valid
        const savedTokenStr = localStorage.getItem('void_google_token')
        if (savedTokenStr) {
          try {
            const savedToken = JSON.parse(savedTokenStr)
            if (
              savedToken &&
              savedToken.access_token &&
              savedToken.expires_at > Date.now()
            ) {
              window.gapi.client.setToken({
                access_token: savedToken.access_token,
              })
            } else {
              localStorage.removeItem('void_google_token')
            }
          } catch (e) {
            console.error('Failed to parse saved Google token', e)
          }
        }

        gapiInited = true
        maybeReady()
      })

      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Defined later
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
  const hasToken = window.gapi?.client?.getToken() !== null
  return hasToken && !isTokenExpired()
}

export const loginToDrive = (onSuccess: () => void) => {
  if (USE_FAKE) {
    onSuccess()
    return
  }
  if (!tokenClient) return

  tokenClient.callback = (resp: TokenResponse) => {
    if (resp.error !== undefined) {
      console.error(resp)
      return
    }

    // Save token to localStorage
    const expiresIn = parseInt(resp.expires_in, 10) || 3600
    const tokenData = {
      access_token: resp.access_token,
      expires_at: Date.now() + expiresIn * 1000,
    }
    localStorage.setItem('void_google_token', JSON.stringify(tokenData))

    // Set token on gapi client
    window.gapi.client.setToken(resp)

    onSuccess()
  }

  // Request the token. Since we only want to prompt if consent is actually needed,
  // we use prompt: '' to avoid forcing consent every time.
  tokenClient.requestAccessToken({ prompt: '' })
}

export const logoutFromDrive = () => {
  if (USE_FAKE) return
  const token = window.gapi?.client?.getToken()
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {})
    window.gapi.client.setToken(null)
  }
  localStorage.removeItem('void_google_token')
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
    const files = getFakeData().filter(
      (f) => f.parentId === parentId && !f.trashed,
    )
    return files.map((f) => ({ id: f.id, name: f.name, mimeType: f.mimeType }))
  }

  return new Promise<DriveFile[]>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        const response = await window.gapi.client.drive.files.list({
          q: `'${parentId}' in parents and trashed=false and (mimeType='application/vnd.google-apps.folder' or mimeType='application/json')`,
          fields: 'files(id, name, mimeType)',
          spaces: 'drive',
          orderBy: 'folder, name',
        })
        resolve(response.result.files || [])
      } catch (error) {
        handleDriveError(error)
        reject(error)
      }
    })
  })
}

export const createFolder = async (
  folderName: string,
  parentId: string = 'root',
) => {
  if (USE_FAKE) {
    const data = getFakeData()
    data.push({
      id: 'folder_' + Math.random().toString(36).substr(2, 9),
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parentId,
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
          parents: [parentId],
        }
        const response = await fetch(
          'https://www.googleapis.com/drive/v3/files',
          {
            method: 'POST',
            headers: authJsonHeaders(),
            body: JSON.stringify(metadata),
          },
        )
        await handleFetchResponse(response)
        resolve()
      } catch (error) {
        handleDriveError(error)
        reject(error)
      }
    })
  })
}

export const saveBoardToDrive = async <T extends object>(
  fileName: string,
  data: T,
  parentId: string = 'root',
): Promise<string> => {
  if (USE_FAKE) {
    const allData = getFakeData()
    const existingIndex = allData.findIndex(
      (f) => f.name === fileName && f.parentId === parentId && !f.trashed,
    )

    let fileId: string
    if (existingIndex > -1) {
      allData[existingIndex].content = JSON.stringify(data)
      fileId = allData[existingIndex].id
    } else {
      fileId = 'file_' + Math.random().toString(36).substr(2, 9)
      allData.push({
        id: fileId,
        name: fileName,
        mimeType: 'application/json',
        parentId,
        content: JSON.stringify(data),
      })
    }
    saveFakeData(allData)
    return fileId
  }

  return new Promise<string>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        const fileContent = JSON.stringify(data)
        const file = new Blob([fileContent], { type: 'application/json' })

        const searchRes = await window.gapi.client.drive.files.list({
          q: `name='${fileName}' and '${parentId}' in parents and mimeType='application/json' and trashed=false`,
          spaces: 'drive',
        })
        const files = searchRes.result.files

        let fileId: string
        if (files && files.length > 0) {
          const metadata = { name: fileName, mimeType: 'application/json' }
          const form = new FormData()
          form.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
          )
          form.append('file', file)

          fileId = files[0].id
          const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
            {
              method: 'PATCH',
              headers: authHeaders(),
              body: form,
            },
          )
          await handleFetchResponse(response)
        } else {
          const metadata = {
            name: fileName,
            mimeType: 'application/json',
            parents: [parentId],
          }
          const form = new FormData()
          form.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
          )
          form.append('file', file)

          const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
              method: 'POST',
              headers: authHeaders(),
              body: form,
            },
          )
          const cleanRes = await handleFetchResponse(response)
          const json = await cleanRes.json()
          fileId = json.id
        }
        resolve(fileId)
      } catch (error) {
        handleDriveError(error)
        reject(error)
      }
    })
  })
}

export const checkFileExists = async (fileId: string): Promise<boolean> => {
  if (USE_FAKE) {
    const file = getFakeData().find((f) => f.id === fileId && !f.trashed)
    return !!file
  }

  return new Promise<boolean>((resolve) => {
    authenticateAndRun(async () => {
      try {
        const file = await window.gapi.client.drive.files.get({
          fileId: fileId,
          fields: 'trashed',
        })
        const isTrashed = file.result.trashed
        resolve(!isTrashed)
      } catch (error) {
        console.error('File does not exist or error checking:', error)
        resolve(false)
      }
    })
  })
}

export const loadBoardFromDriveId = async (fileId: string) => {
  if (USE_FAKE) {
    const file = getFakeData().find((f) => f.id === fileId)
    return file ? JSON.parse(file.content || '{}') : {}
  }

  return new Promise<Record<string, unknown>>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        const fileRes = await window.gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media',
        })
        resolve(fileRes.result)
      } catch (error) {
        handleDriveError(error)
        reject(error)
      }
    })
  })
}

export const deleteFile = async (fileId: string) => {
  if (USE_FAKE) {
    const data = getFakeData()
    const index = data.findIndex((f) => f.id === fileId)
    if (index > -1) {
      data[index].trashed = true
      saveFakeData(data)
    }
    return
  }

  return new Promise<void>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}`,
          {
            method: 'PATCH',
            headers: authJsonHeaders(),
            body: JSON.stringify({ trashed: true }),
          },
        )
        await handleFetchResponse(response)
        resolve()
      } catch (error) {
        handleDriveError(error)
        reject(error)
      }
    })
  })
}

export const moveFile = async (
  fileId: string,
  currentParentId: string,
  newParentId: string,
) => {
  if (USE_FAKE) {
    const data = getFakeData()
    const index = data.findIndex((f) => f.id === fileId)
    if (index > -1) {
      data[index].parentId = newParentId
      saveFakeData(data)
    }
    return
  }

  return new Promise<void>((resolve, reject) => {
    authenticateAndRun(async () => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentId}&removeParents=${currentParentId}`,
          {
            method: 'PATCH',
            headers: authHeaders(),
          },
        )
        await handleFetchResponse(response)
        resolve()
      } catch (error) {
        handleDriveError(error)
        reject(error)
      }
    })
  })
}
