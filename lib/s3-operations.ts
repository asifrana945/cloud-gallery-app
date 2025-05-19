import { initializeS3Client, getBucketName } from "./aws-config"
import { File, type Folder } from "./types"

// List objects in a specific path
export async function listObjects(prefix: string): Promise<{ files: File[]; folders: Folder[] }> {
  const s3 = initializeS3Client()
  const bucketName = getBucketName()

  if (!s3 || !bucketName) {
    throw new Error("AWS S3 client not initialized or bucket name not set")
  }

  const params = {
    Bucket: bucketName,
    Delimiter: "/",
    Prefix: prefix,
  }

  try {
    const data = await s3.listObjectsV2(params).promise()

    // Process files
    const files: File[] = (data.Contents || [])
      .filter((item) => item.Key !== prefix && !item.Key?.endsWith("/")) // Filter out the current directory and folders
      .map((item) => {
        const key = item.Key || ""
        const name = key.split("/").pop() || ""
        const lastModified = item.LastModified || new Date()
        const size = item.Size || 0

        // Generate a signed URL for the file
        const url = s3.getSignedUrl("getObject", {
          Bucket: bucketName,
          Key: key,
          Expires: 3600, // URL expires in 1 hour
        })

        // Determine file type based on extension
        const extension = name.split(".").pop()?.toLowerCase() || ""
        let type = "application/octet-stream" // Default type

        if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
          type = `image/${extension === "jpg" ? "jpeg" : extension}`
        } else if (["mp4", "webm", "ogg"].includes(extension)) {
          type = `video/${extension}`
        } else if (["mp3", "wav"].includes(extension)) {
          type = `audio/${extension}`
        } else if (extension === "pdf") {
          type = "application/pdf"
        }

        return { key, name, lastModified, size, url, type }
      })

    // Process folders (CommonPrefixes)
    const folders: Folder[] = (data.CommonPrefixes || []).map((prefix) => {
      const path = prefix.Prefix || ""
      const name = path.split("/").filter(Boolean).pop() || ""
      return { path, name }
    })

    return { files, folders }
  } catch (error) {
    console.error("Error listing objects:", error)
    throw error
  }
}

// Upload a file to S3
export async function uploadFile(file: File, prefix: string, onProgress?: (progress: number) => void): Promise<string> {
  const s3 = initializeS3Client()
  const bucketName = getBucketName()

  if (!s3 || !bucketName) {
    throw new Error("AWS S3 client not initialized or bucket name not set")
  }

  // Create the full key (path + filename)
  const key = prefix ? `${prefix}${file.name}` : file.name

  // Create upload parameters
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: file.type,
  }

  try {
    // Create managed upload
    const upload = s3.upload(params)

    // Register progress event if callback provided
    if (onProgress) {
      upload.on("httpUploadProgress", (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100)
        onProgress(percentage)
      })
    }

    // Execute upload
    const result = await upload.promise()

    // Return the object URL
    return result.Location
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// Create a new folder
export async function createFolder(prefix: string, folderName: string): Promise<void> {
  const s3 = initializeS3Client()
  const bucketName = getBucketName()

  if (!s3 || !bucketName) {
    throw new Error("AWS S3 client not initialized or bucket name not set")
  }

  // Create the full key with trailing slash to represent a folder
  const key = prefix ? `${prefix}${folderName}/` : `${folderName}/`

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: "", // Empty content for the folder marker object
  }

  try {
    await s3.putObject(params).promise()
  } catch (error) {
    console.error("Error creating folder:", error)
    throw error
  }
}

// Rename a folder (copy all objects to new prefix and delete old ones)
export async function renameFolder(oldPath: string, newName: string): Promise<void> {
  const s3 = initializeS3Client()
  const bucketName = getBucketName()

  if (!s3 || !bucketName) {
    throw new Error("AWS S3 client not initialized or bucket name not set")
  }

  try {
    // Get all objects in the folder
    const { files, folders } = await listObjects(oldPath)

    // Calculate the new path
    const pathParts = oldPath.split("/")
    pathParts.pop() // Remove the empty string after the last slash
    pathParts.pop() // Remove the old folder name
    const parentPath = pathParts.length > 0 ? pathParts.join("/") + "/" : ""
    const newPath = `${parentPath}${newName}/`

    // Create the new folder
    await createFolder(parentPath, newName)

    // Copy all files to the new location
    for (const file of files) {
      const newKey = file.key.replace(oldPath, newPath)
      await s3
        .copyObject({
          Bucket: bucketName,
          CopySource: `${bucketName}/${file.key}`,
          Key: newKey,
        })
        .promise()

      // Delete the original file
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: file.key,
        })
        .promise()
    }

    // Recursively handle subfolders
    for (const folder of folders) {
      await renameFolder(folder.path, folder.name)
    }

    // Delete the original folder marker
    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: oldPath,
      })
      .promise()
  } catch (error) {
    console.error("Error renaming folder:", error)
    throw error
  }
}

// Delete a folder and all its contents
export async function deleteFolder(path: string): Promise<void> {
  const s3 = initializeS3Client()
  const bucketName = getBucketName()

  if (!s3 || !bucketName) {
    throw new Error("AWS S3 client not initialized or bucket name not set")
  }

  try {
    // List all objects in the folder
    const listParams = {
      Bucket: bucketName,
      Prefix: path,
    }

    const listedObjects = await s3.listObjectsV2(listParams).promise()

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      return
    }

    // Create delete params with all objects
    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
        Quiet: false,
      },
    }

    // Delete all objects
    await s3.deleteObjects(deleteParams).promise()

    // Check if the listing was truncated (has more objects)
    if (listedObjects.IsTruncated) {
      await deleteFolder(path)
    }
  } catch (error) {
    console.error("Error deleting folder:", error)
    throw error
  }
}

// Delete a single object
export async function deleteObject(key: string): Promise<void> {
  const s3 = initializeS3Client()
  const bucketName = getBucketName()

  if (!s3 || !bucketName) {
    throw new Error("AWS S3 client not initialized or bucket name not set")
  }

  const params = {
    Bucket: bucketName,
    Key: key,
  }

  try {
    await s3.deleteObject(params).promise()
  } catch (error) {
    console.error("Error deleting object:", error)
    throw error
  }
}

// Resize an image before uploading
export async function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height *= maxWidth / width
        width = maxWidth
      }

      if (height > maxHeight) {
        width *= maxHeight / height
        height = maxHeight
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(resizedFile)
          } else {
            reject(new Error("Could not create blob from canvas"))
          }
        },
        file.type,
        0.9,
      ) // Adjust quality as needed
    }

    img.onerror = (error) => {
      reject(error)
    }
  })
}
