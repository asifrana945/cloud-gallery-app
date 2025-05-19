export interface File {
  key: string
  name: string
  lastModified: Date
  size: number
  url: string
  type: string
}

export interface Folder {
  path: string
  name: string
}
