"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Upload,
  X,
  ImageIcon,
  FileText,
  Film,
  FileAudio,
  FilePlus2,
  FolderUp,
  FolderInput,
  CloudUpload,
  Check,
} from "lucide-react"
import { uploadFile, resizeImage } from "@/lib/s3-operations"
import { motion, AnimatePresence } from "framer-motion"
import { FolderSelector } from "@/components/folder-selector"
import type { Folder } from "@/lib/types"

interface FileUploadProps {
  currentPath: string
  onSuccess: () => void
  onError: (error: Error) => void
  allFolders: Folder[]
}

export function FileUpload({ currentPath, onSuccess, onError, allFolders }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [showFolderSelector, setShowFolderSelector] = useState(false)
  const [destinationPath, setDestinationPath] = useState(currentPath)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const uploadPromises = files.map(async (file) => {
      try {
        // Initialize progress for this file
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }))

        // Resize image if it's an image file
        let fileToUpload = file
        if (file.type.startsWith("image/")) {
          try {
            fileToUpload = await resizeImage(file, 1920, 1080)
          } catch (resizeError) {
            console.error("Error resizing image:", resizeError)
            // Continue with original file if resize fails
          }
        }

        // Upload the file to the selected destination path
        await uploadFile(fileToUpload, destinationPath, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }))
        })

        return { success: true, file }
      } catch (error) {
        console.error("Upload error for file", file.name, error)
        return { success: false, file, error }
      }
    })

    try {
      const results = await Promise.all(uploadPromises)
      const failures = results.filter((r) => !r.success)

      if (failures.length > 0) {
        const errorMessages = failures.map((f) => `${f.file.name}: ${f.error?.message || "Unknown error"}`).join(", ")
        onError(new Error(`Failed to upload: ${errorMessages}`))
      } else {
        onSuccess()
        setFiles([])
        setUploadProgress({})
      }
    } catch (error) {
      console.error("Error during upload process:", error)
      onError(error instanceof Error ? error : new Error("Upload process failed"))
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />
    } else if (file.type.startsWith("video/")) {
      return <Film className="h-5 w-5 text-red-500" />
    } else if (file.type.startsWith("audio/")) {
      return <FileAudio className="h-5 w-5 text-purple-500" />
    } else if (file.type.includes("pdf")) {
      return <FileText className="h-5 w-5 text-orange-500" />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const handleSelectFolder = () => {
    setShowFolderSelector(true)
  }

  const handleFolderSelected = (path: string) => {
    setDestinationPath(path)
  }

  return (
    <Card className="premium-card mb-6">
      <CardHeader className="bg-muted/30 pb-3 border-b border-border/20">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-primary/10">
            <FilePlus2 className="h-5 w-5 text-primary" />
          </div>
          <span className="gradient-text font-bold">Upload Files</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
            isDragging
              ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3"
              animate={{ y: isDragging ? [-10, 0, -10] : 0 }}
              transition={{ repeat: isDragging ? Number.POSITIVE_INFINITY : 0, duration: 1.5 }}
            >
              <CloudUpload className="h-8 w-8 text-primary" />
            </motion.div>
            <h3 className="text-lg font-medium mb-1">Upload Files</h3>
            <p className="text-sm text-muted-foreground mb-4">Drag and drop files here or click to browse</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="premium-button text-white"
                id="fileInput"
              >
                <FileText className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              <Button
                onClick={handleSelectFolder}
                disabled={isUploading}
                variant="outline"
                className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <FolderInput className="h-4 w-4 mr-2" />
                {destinationPath === currentPath ? "Current Folder" : "Change Folder"}
              </Button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
          </motion.div>
        </div>

        {destinationPath !== currentPath && (
          <motion.div
            className="mt-3 p-2 glass-effect rounded-lg text-sm flex items-center"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
          >
            <FolderUp className="h-4 w-4 mr-2 text-amber-500" />
            <span className="text-muted-foreground mr-1">Uploading to:</span>
            <span className="font-medium truncate">
              {destinationPath === "" ? "Root" : destinationPath.split("/").filter(Boolean).join("/")}
            </span>
          </motion.div>
        )}

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              className="mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="font-medium mb-2 flex items-center">
                <span>Selected Files</span>
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{files.length}</span>
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 premium-scrollbar">
                {files.map((file, index) => (
                  <motion.div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between glass-effect p-2 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      {getFileIcon(file)}
                      <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                    </div>
                    <div className="flex items-center">
                      {uploadProgress[file.name] !== undefined && (
                        <div className="w-16 mr-2">
                          {uploadProgress[file.name] === 100 ? (
                            <div className="flex items-center justify-center">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                          ) : (
                            <Progress value={uploadProgress[file.name]} className="h-2" />
                          )}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeFile(index)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
              <Button className="w-full mt-3 premium-button text-white" onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload All Files
                  </span>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <FolderSelector
        open={showFolderSelector}
        onClose={() => setShowFolderSelector(false)}
        onSelect={handleFolderSelected}
        allFolders={allFolders}
        currentPath={currentPath}
        title="Select Destination Folder"
      />
    </Card>
  )
}
