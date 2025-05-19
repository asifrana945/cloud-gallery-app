"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder, FolderOpen, Home, ChevronRight, FolderTree } from "lucide-react"
import type { Folder as FolderType } from "@/lib/types"
import { motion } from "framer-motion"

interface FolderSelectorProps {
  open: boolean
  onClose: () => void
  onSelect: (path: string) => void
  allFolders: FolderType[]
  currentPath?: string
  title?: string
}

export function FolderSelector({
  open,
  onClose,
  onSelect,
  allFolders,
  currentPath = "",
  title = "Select Destination Folder",
}: FolderSelectorProps) {
  const [selectedPath, setSelectedPath] = useState<string>(currentPath)

  // Group folders by their parent paths
  const foldersByPath: Record<string, FolderType[]> = {
    "": [], // Root level folders
  }

  // First pass: create entries for all paths
  allFolders.forEach((folder) => {
    const pathParts = folder.path.split("/")
    pathParts.pop() // Remove empty string after last slash

    if (pathParts.length > 0) {
      const parentPath = pathParts.slice(0, -1).join("/") + (pathParts.length > 1 ? "/" : "")
      if (!foldersByPath[parentPath]) {
        foldersByPath[parentPath] = []
      }
    }
  })

  // Second pass: populate folders
  allFolders.forEach((folder) => {
    const pathParts = folder.path.split("/")
    pathParts.pop() // Remove empty string after last slash

    if (pathParts.length === 1) {
      // Root level folder
      foldersByPath[""].push(folder)
    } else if (pathParts.length > 1) {
      const parentPath = pathParts.slice(0, -1).join("/") + "/"
      if (foldersByPath[parentPath]) {
        foldersByPath[parentPath].push(folder)
      }
    }
  })

  const handleSelect = () => {
    onSelect(selectedPath)
    onClose()
  }

  const renderFolderTree = (path = "", level = 0) => {
    const folders = foldersByPath[path] || []

    return (
      <div className="pl-4">
        {folders.map((folder, index) => (
          <motion.div
            key={folder.path}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <div
              className={`
                flex items-center p-2 my-1 rounded-md cursor-pointer transition-all duration-200
                ${selectedPath === folder.path ? "bg-primary/20 text-primary" : "hover:bg-muted hover:shadow-sm"}
              `}
              onClick={() => setSelectedPath(folder.path)}
            >
              <div className="flex items-center flex-1 overflow-hidden">
                {selectedPath === folder.path ? (
                  <div className="p-1 rounded-md bg-amber-500/10">
                    <FolderOpen className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  </div>
                ) : (
                  <div className="p-1 rounded-md bg-amber-500/5">
                    <Folder className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                  </div>
                )}
                <span className="truncate ml-2">{folder.name}</span>
              </div>
            </div>

            {/* Render subfolders if this folder has any */}
            {foldersByPath[folder.path] && foldersByPath[folder.path].length > 0 && (
              <div className="border-l border-border/50 ml-2">{renderFolderTree(folder.path, level + 1)}</div>
            )}
          </motion.div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-effect sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[300px] mt-4 pr-4 premium-scrollbar">
          <div
            className={`
              flex items-center p-2 my-1 rounded-md cursor-pointer transition-all duration-200
              ${selectedPath === "" ? "bg-primary/20 text-primary" : "hover:bg-muted hover:shadow-sm"}
            `}
            onClick={() => setSelectedPath("")}
          >
            <div className="p-1 rounded-md bg-primary/10">
              <Home className="h-4 w-4" />
            </div>
            <span className="ml-2">Root</span>
          </div>

          {renderFolderTree()}
        </ScrollArea>

        <div className="mt-2 p-2 bg-muted/50 rounded-md glass-effect">
          <p className="text-sm font-medium">Selected path:</p>
          <div className="flex items-center flex-wrap mt-1 text-sm">
            {selectedPath === "" ? (
              <span className="text-muted-foreground">Root directory</span>
            ) : (
              <>
                <Home className="h-3.5 w-3.5 inline mr-1" />
                {selectedPath
                  .split("/")
                  .filter(Boolean)
                  .map((part, i, arr) => (
                    <span key={i} className="flex items-center">
                      <span className="text-primary">{part}</span>
                      {i < arr.length - 1 && <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />}
                    </span>
                  ))}
              </>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} className="border-border/50 hover:bg-muted/50">
            Cancel
          </Button>
          <Button onClick={handleSelect} className="premium-button text-white">
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
