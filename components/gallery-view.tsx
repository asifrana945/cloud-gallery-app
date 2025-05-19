"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
import {
  ImageIcon,
  FileText,
  Film,
  Download,
  Trash2,
  ArrowUpDown,
  Filter,
  Loader2,
  FileAudio,
  FileBadge,
  FileIcon,
  FolderOpen,
  Eye,
  FolderX,
  Grid,
  List,
  FileSpreadsheet,
  FileCode,
  FilePieChart,
  MoreVertical,
} from "lucide-react"
import type { File, Folder as FolderType } from "@/lib/types"
import { formatFileSize, formatDate } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface GalleryViewProps {
  files: File[]
  folders: FolderType[]
  isLoading: boolean
  sortBy: "name" | "date" | "size"
  sortOrder: "asc" | "desc"
  filterType: "all" | "image" | "video" | "document" | "audio"
  onSortChange: (sort: "name" | "date" | "size") => void
  onSortOrderChange: (order: "asc" | "desc") => void
  onFilterChange: (filter: "all" | "image" | "video" | "document" | "audio") => void
  onFileSelect: (file: File) => void
  onFileDelete: (file: File) => void
  onFolderNavigate: (path: string) => void
}

export function GalleryView({
  files,
  folders,
  isLoading,
  sortBy,
  sortOrder,
  filterType,
  onSortChange,
  onSortOrderChange,
  onFilterChange,
  onFileSelect,
  onFileDelete,
  onFolderNavigate,
}: GalleryViewProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-6 w-6 text-blue-500" />
    } else if (file.type.startsWith("video/")) {
      return <Film className="h-6 w-6 text-red-500" />
    } else if (file.type.startsWith("audio/")) {
      return <FileAudio className="h-6 w-6 text-purple-500" />
    } else if (file.type.includes("pdf")) {
      return <FileBadge className="h-6 w-6 text-orange-500" />
    } else if (file.type.includes("doc") || file.type.includes("word")) {
      return <FileText className="h-6 w-6 text-blue-600" />
    } else if (file.type.includes("xls") || file.type.includes("sheet")) {
      return <FileSpreadsheet className="h-6 w-6 text-green-600" />
    } else if (file.type.includes("ppt") || file.type.includes("presentation")) {
      return <FilePieChart className="h-6 w-6 text-red-600" />
    } else if (
      file.type.includes("json") ||
      file.type.includes("xml") ||
      file.type.includes("html") ||
      file.type.includes("css") ||
      file.type.includes("js")
    ) {
      return <FileCode className="h-6 w-6 text-emerald-500" />
    } else {
      return <FileIcon className="h-6 w-6 text-gray-500" />
    }
  }

  const getFilePreview = (file: File) => {
    if (file.type.startsWith("image/") && !imageLoadError[file.key]) {
      return (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
          <img
            src={file.url || "/placeholder.svg?height=128&width=256"}
            alt={file.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            crossOrigin="anonymous"
            onError={() => {
              setImageLoadError((prev) => ({ ...prev, [file.key]: true }))
            }}
          />
        </div>
      )
    } else if (file.type.startsWith("video/")) {
      return (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <Film className="h-10 w-10 text-red-500/70" />
        </div>
      )
    } else if (file.type.startsWith("audio/")) {
      return (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <FileAudio className="h-10 w-10 text-purple-500/70" />
        </div>
      )
    } else if (file.type.includes("pdf")) {
      return (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <FileBadge className="h-10 w-10 text-orange-500/70" />
        </div>
      )
    } else {
      return (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
      )
    }
  }

  const handleDownload = (file: File) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const getFilterLabel = () => {
    switch (filterType) {
      case "all":
        return "All Files"
      case "image":
        return "Images"
      case "video":
        return "Videos"
      case "audio":
        return "Audio"
      case "document":
        return "Documents"
      default:
        return "All Files"
    }
  }

  const getFilterIcon = () => {
    switch (filterType) {
      case "image":
        return <ImageIcon className="h-4 w-4 mr-1" />
      case "video":
        return <Film className="h-4 w-4 mr-1" />
      case "audio":
        return <FileAudio className="h-4 w-4 mr-1" />
      case "document":
        return <FileText className="h-4 w-4 mr-1" />
      default:
        return <Filter className="h-4 w-4 mr-1" />
    }
  }

  const toggleFileActions = (fileKey: string) => {
    setSelectedFile(selectedFile === fileKey ? null : fileKey)
  }

  return (
    <Card className="premium-card">
      <CardHeader className="bg-muted/30 pb-3 border-b border-border/20">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-primary/10">
              <FileIcon className="h-5 w-5 text-primary" />
            </div>
            <span className="gradient-text font-bold">Files & Folders</span>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                >
                  {getFilterIcon()}
                  <span className="hidden xs:inline">{getFilterLabel()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-effect">
                <DropdownMenuRadioGroup value={filterType} onValueChange={(value) => onFilterChange(value as any)}>
                  <DropdownMenuRadioItem value="all">
                    <Filter className="h-4 w-4 mr-2" />
                    All Files
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="image">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Images Only
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="video">
                    <Film className="h-4 w-4 mr-2" />
                    Videos Only
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="audio">
                    <FileAudio className="h-4 w-4 mr-2" />
                    Audio Only
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="document">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents Only
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 border-border/50 hover:border-primary/50 hover:bg-primary/5"
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  <span className="hidden xs:inline">
                    Sort: {sortBy === "name" ? "Name" : sortBy === "date" ? "Date" : "Size"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-effect">
                <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => onSortChange(value as any)}>
                  <DropdownMenuRadioItem value="name">Sort by Name</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="date">Sort by Date</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="size">Sort by Size</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? "Descending Order" : "Ascending Order"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
              className="border-border/50 hover:border-primary/50 hover:bg-primary/5"
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          </div>
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-3 animate-float">
                <FolderX className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium mb-2">No files or folders</h3>
              <p className="text-muted-foreground mb-4">Upload files or create folders to get started</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  className="premium-button text-white"
                  onClick={() => document.getElementById("fileInput")?.click()}
                >
                  <FileIcon className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <Button variant="outline" className="border-primary/30 hover:border-primary/50 hover:bg-primary/5">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Create Folder
                </Button>
              </div>
            </motion.div>
          </div>
        ) : viewMode === "grid" ? (
          <motion.div
            className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {/* Folders */}
            {folders.map((folder) => (
              <motion.div
                key={folder.path}
                variants={item}
                className="group cursor-pointer"
                onClick={() => onFolderNavigate(folder.path)}
                onMouseEnter={() => setHoveredItem(folder.path)}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="folder-card p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <motion.div
                      animate={{ rotate: hoveredItem === folder.path ? [0, -10, 0] : 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-2 rounded-full bg-amber-500/10"
                    >
                      <FolderOpen className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                    </motion.div>
                    <span className="font-medium truncate">{folder.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Folder</div>
                </div>
              </motion.div>
            ))}

            {/* Files */}
            {files.map((file) => (
              <motion.div
                key={file.key}
                variants={item}
                className="group relative"
                onMouseEnter={() => setHoveredItem(file.key)}
                onMouseLeave={() => setHoveredItem(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="file-card">
                  <div className="cursor-pointer" onClick={() => onFileSelect(file)}>
                    {getFilePreview(file)}
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(file)}
                          <span className="font-medium text-sm truncate max-w-[150px]">{file.name}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{formatDate(file.lastModified)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop hover actions */}
                  <AnimatePresence>
                    {hoveredItem === file.key && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-2 right-2 flex space-x-1 hidden sm:flex"
                      >
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 glass-effect shadow-md"
                          onClick={() => onFileSelect(file)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 glass-effect shadow-md"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 glass-effect shadow-md hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onFileDelete(file)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Mobile actions */}
                  <div className="absolute top-2 right-2 sm:hidden">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 glass-effect shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFileActions(file.key)
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>

                    <AnimatePresence>
                      {selectedFile === file.key && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute top-full right-0 mt-1 bg-background/80 backdrop-blur-md rounded-md shadow-lg p-1 flex flex-col gap-1 border border-border/30"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFileSelect(file)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(file)
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              onFileDelete(file)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="space-y-2 premium-scrollbar">
            {/* List view for folders */}
            {folders.map((folder) => (
              <motion.div
                key={folder.path}
                variants={item}
                initial="hidden"
                animate="show"
                className="folder-card flex items-center justify-between p-3 group"
                onClick={() => onFolderNavigate(folder.path)}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-1.5 rounded-full bg-amber-500/10">
                    <FolderOpen className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  </div>
                  <span className="font-medium truncate max-w-[200px]">{folder.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">Folder</span>
              </motion.div>
            ))}

            {/* List view for files */}
            {files.map((file) => (
              <motion.div
                key={file.key}
                variants={item}
                initial="hidden"
                animate="show"
                className="file-card p-3 group"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div
                    className="flex items-center space-x-3 flex-1 min-w-0"
                    onClick={() => onFileSelect(file)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="p-1.5 rounded-full bg-muted/50 shrink-0">{getFileIcon(file)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10 hidden sm:flex"
                      onClick={() => onFileSelect(file)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10 hidden sm:flex"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive hidden sm:flex"
                      onClick={() => onFileDelete(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>

                    {/* Mobile dropdown */}
                    <div className="sm:hidden relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFileActions(file.key)
                        }}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>

                      <AnimatePresence>
                        {selectedFile === file.key && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute top-full right-0 mt-1 bg-background/80 backdrop-blur-md rounded-md shadow-lg p-1 flex flex-col gap-1 border border-border/30 z-10"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start"
                              onClick={(e) => {
                                e.stopPropagation()
                                onFileSelect(file)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(file)
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                onFileDelete(file)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
