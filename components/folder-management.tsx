"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Folder,
  FolderPlus,
  MoreVertical,
  Edit,
  Trash2,
  FolderOpen,
  FolderInput,
  FolderX,
  FolderCog,
} from "lucide-react"
import { createFolder, renameFolder, deleteFolder } from "@/lib/s3-operations"
import type { Folder as FolderType } from "@/lib/types"
import { motion } from "framer-motion"
import { FolderSelector } from "@/components/folder-selector"

interface FolderManagementProps {
  currentPath: string
  folders: FolderType[]
  allFolders: FolderType[]
  onFolderCreate: (folderName: string) => void
  onFolderRename: (oldName: string, newName: string) => void
  onFolderDelete: (folderName: string) => void
  onNavigate: (path: string) => void
}

export function FolderManagement({
  currentPath,
  folders,
  allFolders,
  onFolderCreate,
  onFolderRename,
  onFolderDelete,
  onNavigate,
}: FolderManagementProps) {
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [folderToRename, setFolderToRename] = useState<FolderType | null>(null)
  const [newName, setNewName] = useState("")
  const [folderToDelete, setFolderToDelete] = useState<FolderType | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showFolderSelector, setShowFolderSelector] = useState(false)
  const [selectedParentPath, setSelectedParentPath] = useState(currentPath)

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    setIsProcessing(true)
    try {
      await createFolder(selectedParentPath, newFolderName)
      onFolderCreate(newFolderName)
      setNewFolderName("")
      setIsCreatingFolder(false)
      setSelectedParentPath(currentPath) // Reset to current path
    } catch (error) {
      console.error("Error creating folder:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRenameFolder = async () => {
    if (!folderToRename || !newName.trim()) return

    setIsProcessing(true)
    try {
      await renameFolder(folderToRename.path, newName)
      onFolderRename(folderToRename.name, newName)
      setFolderToRename(null)
      setNewName("")
    } catch (error) {
      console.error("Error renaming folder:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return

    setIsProcessing(true)
    try {
      await deleteFolder(folderToDelete.path)
      onFolderDelete(folderToDelete.name)
      setFolderToDelete(null)
    } catch (error) {
      console.error("Error deleting folder:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const openRenameDialog = (folder: FolderType) => {
    setFolderToRename(folder)
    setNewName(folder.name)
  }

  const openDeleteDialog = (folder: FolderType) => {
    setFolderToDelete(folder)
  }

  const handleSelectParentFolder = () => {
    setShowFolderSelector(true)
  }

  const handleParentFolderSelected = (path: string) => {
    setSelectedParentPath(path)
  }

  return (
    <Card className="premium-card">
      <CardHeader className="bg-muted/30 pb-3 border-b border-border/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-amber-500/10">
              <FolderOpen className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            </div>
            <span className="gradient-text font-bold">Folders</span>
          </CardTitle>
          <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-8 border-primary/30 hover:border-primary/50 hover:bg-primary/5"
              >
                <FolderPlus className="h-4 w-4 mr-1" />
                <span className="hidden xs:inline">New Folder</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FolderPlus className="h-5 w-5 text-primary" />
                  Create New Folder
                </DialogTitle>
                <DialogDescription>Enter a name for your new folder</DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Folder Name</label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="premium-input"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Parent Folder</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-2 border rounded-md text-sm bg-muted/30 truncate">
                      {selectedParentPath === "" ? "Root" : selectedParentPath.split("/").filter(Boolean).join("/")}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectParentFolder}
                      className="border-primary/30 hover:border-primary/50 hover:bg-primary/5"
                    >
                      <FolderInput className="h-4 w-4 mr-1" />
                      Browse
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingFolder(false)
                    setSelectedParentPath(currentPath) // Reset on cancel
                  }}
                  disabled={isProcessing}
                  className="border-border/50 hover:bg-muted/50"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateFolder}
                  disabled={isProcessing || !newFolderName.trim()}
                  className="premium-button text-white"
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                      Creating...
                    </span>
                  ) : (
                    <span>Create Folder</span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {folders.length === 0 ? (
          <div className="text-center py-8 px-4">
            <motion.div
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                <FolderX className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-lg mb-1">No folders found</p>
              <p className="text-sm text-muted-foreground mb-4">Create a new folder to organize your files</p>
              <Button onClick={() => setIsCreatingFolder(true)} className="premium-button text-white">
                <FolderPlus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto pr-1 premium-scrollbar py-2">
            {folders.map((folder, index) => (
              <motion.div
                key={folder.path}
                className="folder-card flex items-center justify-between p-2 group"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                whileHover={{ backgroundColor: "rgba(var(--muted), 0.7)" }}
              >
                <div
                  className="flex items-center space-x-2 cursor-pointer flex-1 overflow-hidden"
                  onClick={() => onNavigate(folder.path)}
                >
                  <motion.div
                    whileHover={{ rotate: [-5, 0, -5], transition: { repeat: Number.POSITIVE_INFINITY, duration: 1 } }}
                    className="p-1 rounded-md bg-amber-500/10"
                  >
                    <Folder className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  </motion.div>
                  <span className="truncate font-medium">{folder.name}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-muted/70"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="glass-effect">
                    <DropdownMenuItem onClick={() => openRenameDialog(folder)} className="cursor-pointer">
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => openDeleteDialog(folder)}
                      className="cursor-pointer text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            ))}
          </div>
        )}

        {/* Rename Folder Dialog */}
        <Dialog open={!!folderToRename} onOpenChange={(open) => !open && setFolderToRename(null)}>
          <DialogContent className="glass-effect sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderCog className="h-5 w-5 text-primary" />
                Rename Folder
              </DialogTitle>
              <DialogDescription>Enter a new name for "{folderToRename?.name}"</DialogDescription>
            </DialogHeader>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New folder name"
              className="premium-input mt-2"
            />
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setFolderToRename(null)}
                disabled={isProcessing}
                className="border-border/50 hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRenameFolder}
                disabled={isProcessing || !newName.trim()}
                className="premium-button text-white"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                    Renaming...
                  </span>
                ) : (
                  <span>Rename Folder</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Folder Dialog */}
        <Dialog open={!!folderToDelete} onOpenChange={(open) => !open && setFolderToDelete(null)}>
          <DialogContent className="glass-effect sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <FolderX className="h-5 w-5" />
                Delete Folder
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the folder "{folderToDelete?.name}"? This will also delete all files and
                subfolders inside it.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3 mt-2">
              <p className="text-sm text-destructive">
                This action cannot be undone. All contents will be permanently deleted.
              </p>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setFolderToDelete(null)}
                disabled={isProcessing}
                className="border-border/50 hover:bg-muted/50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteFolder}
                disabled={isProcessing}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isProcessing ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                    Deleting...
                  </span>
                ) : (
                  <span>Delete Folder</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Folder Selector Dialog */}
        <FolderSelector
          open={showFolderSelector}
          onClose={() => setShowFolderSelector(false)}
          onSelect={handleParentFolderSelected}
          allFolders={allFolders}
          currentPath={currentPath}
          title="Select Parent Folder"
        />
      </CardContent>
    </Card>
  )
}
