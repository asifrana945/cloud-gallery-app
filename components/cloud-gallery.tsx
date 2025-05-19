"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { FileUpload } from "@/components/file-upload"
import { FolderManagement } from "@/components/folder-management"
import { GalleryView } from "@/components/gallery-view"
import { FilePreview } from "@/components/file-preview"
import { useToast } from "@/components/ui/use-toast"
import { initializeS3Client } from "@/lib/aws-config"
import type { File as FileType, Folder } from "@/lib/types"
import { listObjects, deleteObject } from "@/lib/s3-operations"
import { AnimatePresence, motion } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export function CloudGallery() {
  const [currentPath, setCurrentPath] = useState<string>("")
  const [files, setFiles] = useState<FileType[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [sortBy, setSortBy] = useState<"name" | "date" | "size">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterType, setFilterType] = useState<"all" | "image" | "video" | "document" | "audio">("all")
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [allFolders, setAllFolders] = useState<Folder[]>([])
  const { toast } = useToast()

  // Fetch all folders for folder selection
  useEffect(() => {
    const fetchAllFolders = async () => {
      try {
        const rootResult = await listObjects("")
        let folders = [...rootResult.folders]

        // Recursively fetch subfolders (limited to 1 level for performance)
        for (const folder of rootResult.folders) {
          try {
            const subResult = await listObjects(folder.path)
            folders = [...folders, ...subResult.folders]
          } catch (error) {
            console.error(`Error fetching subfolders for ${folder.path}:`, error)
          }
        }

        setAllFolders(folders)
      } catch (error) {
        console.error("Error fetching all folders:", error)
      }
    }

    fetchAllFolders()
  }, [])

  useEffect(() => {
    const s3 = initializeS3Client()
    if (!s3) {
      setError("AWS Configuration Error: Please check your AWS credentials in the .env file")
      setIsLoading(false)
      return
    }

    fetchFilesAndFolders()
  }, [currentPath])

  const fetchFilesAndFolders = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { files, folders } = await listObjects(currentPath)
      setFiles(files)
      setFolders(folders)
    } catch (error) {
      console.error("Error fetching files:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(`Error fetching files: ${errorMessage}`)
      toast({
        title: "Error fetching files",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUploadSuccess = () => {
    fetchFilesAndFolders()
    toast({
      title: "Upload Successful",
      description: "Your file has been uploaded successfully",
      variant: "success",
    })
  }

  const handleFileUploadError = (error: Error) => {
    toast({
      title: "Upload Failed",
      description: error.message,
      variant: "destructive",
    })
  }

  const handleFolderCreate = (folderName: string) => {
    fetchFilesAndFolders()
    // Also update allFolders
    const newFolder: Folder = {
      path: currentPath + folderName + "/",
      name: folderName,
    }
    setAllFolders((prev) => [...prev, newFolder])

    toast({
      title: "Folder Created",
      description: `Folder "${folderName}" has been created`,
      variant: "success",
    })
  }

  const handleFolderRename = (oldName: string, newName: string) => {
    fetchFilesAndFolders()

    // Update allFolders with the renamed folder
    setAllFolders((prev) => {
      const oldPath = currentPath + oldName + "/"
      const newPath = currentPath + newName + "/"

      return prev.map((folder) => {
        if (folder.path === oldPath) {
          return { ...folder, path: newPath, name: newName }
        }
        // Also update subfolders paths
        if (folder.path.startsWith(oldPath)) {
          const updatedPath = folder.path.replace(oldPath, newPath)
          return { ...folder, path: updatedPath }
        }
        return folder
      })
    })

    toast({
      title: "Folder Renamed",
      description: `Folder renamed from "${oldName}" to "${newName}"`,
      variant: "success",
    })
  }

  const handleFolderDelete = (folderName: string) => {
    fetchFilesAndFolders()

    // Remove deleted folder from allFolders
    const deletedPath = currentPath + folderName + "/"
    setAllFolders((prev) => prev.filter((folder) => !folder.path.startsWith(deletedPath)))

    toast({
      title: "Folder Deleted",
      description: `Folder "${folderName}" has been deleted`,
      variant: "success",
    })
  }

  const handleFileDelete = async (file: FileType) => {
    try {
      await deleteObject(file.key)
      fetchFilesAndFolders()
      toast({
        title: "File Deleted",
        description: `File "${file.name}" has been deleted`,
        variant: "success",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (file: FileType) => {
    setSelectedFile(file)
  }

  const handleClosePreview = () => {
    setSelectedFile(null)
  }

  const navigateToFolder = (path: string) => {
    setCurrentPath(path)
  }

  const navigateUp = () => {
    const pathParts = currentPath.split("/")
    pathParts.pop() // Remove the last folder
    pathParts.pop() // Remove the empty string after the last slash
    const newPath = pathParts.join("/") + (pathParts.length > 0 ? "/" : "")
    setCurrentPath(newPath)
  }

  const sortedFiles = [...files]
    .sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      } else if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()
          : new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      } else {
        return sortOrder === "asc" ? a.size - b.size : b.size - a.size
      }
    })
    .filter((file) => {
      if (filterType === "all") return true
      if (filterType === "image") return file.type.startsWith("image/")
      if (filterType === "video") return file.type.startsWith("video/")
      if (filterType === "audio") return file.type.startsWith("audio/")
      if (filterType === "document") {
        return (
          file.type.includes("pdf") ||
          file.type.includes("doc") ||
          file.type.includes("xls") ||
          file.type.includes("ppt") ||
          file.type.includes("text")
        )
      }
      return true
    })

  const handleRetry = () => {
    fetchFilesAndFolders()
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar currentPath={currentPath} navigateUp={navigateUp} navigateToFolder={navigateToFolder} />

      <div className="container mx-auto px-4 py-6 flex-1">
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Alert variant="destructive" className="mb-6 glass-effect">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
              <div className="mt-2">
                <button onClick={handleRetry} className="premium-button text-white px-3 py-1 rounded-md text-sm">
                  Retry
                </button>
              </div>
            </Alert>
          </motion.div>
        )}

        {isLoading && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center gap-2 p-6 rounded-xl glass-effect shadow-lg">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <p className="text-lg font-medium">Loading content...</p>
              <p className="text-sm text-muted-foreground">Please wait while we fetch your files</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <motion.div
            className="w-full lg:w-1/4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FileUpload
              currentPath={currentPath}
              onSuccess={handleFileUploadSuccess}
              onError={handleFileUploadError}
              allFolders={allFolders}
            />
            <FolderManagement
              currentPath={currentPath}
              folders={folders}
              allFolders={allFolders}
              onFolderCreate={handleFolderCreate}
              onFolderRename={handleFolderRename}
              onFolderDelete={handleFolderDelete}
              onNavigate={navigateToFolder}
            />
          </motion.div>

          <motion.div
            className="w-full lg:w-3/4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GalleryView
              files={sortedFiles}
              folders={folders}
              isLoading={isLoading}
              sortBy={sortBy}
              sortOrder={sortOrder}
              filterType={filterType}
              onSortChange={setSortBy}
              onSortOrderChange={setSortOrder}
              onFilterChange={setFilterType}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
              onFolderNavigate={navigateToFolder}
            />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {selectedFile && <FilePreview file={selectedFile} onClose={handleClosePreview} />}
      </AnimatePresence>
    </div>
  )
}
