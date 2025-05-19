"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Cloud, ChevronRight, Home, ChevronUp, FolderOpen, Search, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface NavbarProps {
  currentPath: string
  navigateUp: () => void
  navigateToFolder: (path: string) => void
}

export function Navbar({ currentPath, navigateUp, navigateToFolder }: NavbarProps) {
  const [mounted, setMounted] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const pathParts = currentPath.split("/").filter(Boolean)

  const handleBreadcrumbClick = (index: number) => {
    const newPath = pathParts.slice(0, index + 1).join("/") + "/"
    navigateToFolder(newPath)
  }

  return (
    <motion.div
      className="sticky top-0 z-10 glass-effect border-b border-border/30 shadow-sm"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center">
            <motion.div
              className="flex items-center space-x-2 mr-6"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="premium-icon text-white">
                <Cloud className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold gradient-text">Cloud Gallery</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-1 overflow-x-auto max-w-[40vw] scrollbar-hide">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 hover:bg-primary/10 transition-colors rounded-lg shrink-0"
                onClick={() => navigateToFolder("")}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>

              {pathParts.length > 0 && (
                <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="shrink-0">
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
                </motion.div>
              )}

              {pathParts.map((part, index) => (
                <motion.div
                  key={index}
                  className="flex items-center shrink-0"
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-primary/10 transition-colors rounded-lg"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="truncate max-w-[100px]">{part}</span>
                  </Button>
                  {index < pathParts.length - 1 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {showSearch ? (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "150px", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative hidden sm:block"
              >
                <Input
                  placeholder="Search files..."
                  className="premium-input h-9 pr-8"
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                />
                <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
              </motion.div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-primary/10 hidden sm:flex"
                onClick={() => setShowSearch(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {pathParts.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={navigateUp}
                className="hidden sm:flex items-center gap-1 rounded-lg border-border/50 hover:bg-primary/10 hover:border-primary/50"
              >
                <ChevronUp className="h-4 w-4" />
                <span className="hidden sm:inline">Up</span>
              </Button>
            )}

            {mounted && <ThemeToggle />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all hidden sm:flex">
                  <AvatarImage src="/placeholder.svg?height=36&width=36" />
                  <AvatarFallback className="bg-primary/20">CG</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-effect">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="glass-effect w-[80vw] sm:max-w-sm">
                <div className="flex flex-col h-full">
                  <div className="py-6 border-b border-border/20">
                    <div className="flex items-center mb-6">
                      <div className="premium-icon text-white mr-3">
                        <Cloud className="h-5 w-5" />
                      </div>
                      <span className="text-xl font-bold gradient-text">Cloud Gallery</span>
                    </div>

                    <div className="relative mb-4">
                      <Input placeholder="Search files..." className="premium-input pr-8" />
                      <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start"
                        onClick={() => {
                          navigateToFolder("")
                        }}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Home
                      </Button>

                      {pathParts.length > 0 && (
                        <div className="pl-2 border-l-2 border-border/30 ml-2 mt-2">
                          {pathParts.map((part, index) => (
                            <Button
                              key={index}
                              variant="ghost"
                              size="sm"
                              className="justify-start mb-1"
                              onClick={() => {
                                handleBreadcrumbClick(index)
                              }}
                            >
                              <FolderOpen className="h-4 w-4 mr-2 text-amber-500" />
                              {part}
                            </Button>
                          ))}
                        </div>
                      )}

                      {pathParts.length > 0 && (
                        <Button variant="outline" size="sm" onClick={navigateUp} className="justify-start mt-2">
                          <ChevronUp className="h-4 w-4 mr-2" />
                          Up a Level
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="py-4 border-b border-border/20">
                    <div className="flex items-center mb-2">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback className="bg-primary/20">CG</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Cloud User</p>
                        <p className="text-sm text-muted-foreground">user@example.com</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-4 flex-1">
                    <Button variant="ghost" className="w-full justify-start mb-2">
                      Profile
                    </Button>
                    <Button variant="ghost" className="w-full justify-start mb-2">
                      Settings
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile breadcrumb */}
        <AnimatePresence>
          {pathParts.length > 0 && (
            <motion.div
              className="md:hidden py-2 overflow-x-auto scrollbar-hide flex items-center"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 hover:bg-primary/10 transition-colors rounded-lg shrink-0"
                onClick={() => navigateToFolder("")}
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>

              <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground shrink-0" />

              {pathParts.map((part, index) => (
                <div key={index} className="flex items-center shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 hover:bg-primary/10 transition-colors rounded-lg"
                    onClick={() => handleBreadcrumbClick(index)}
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="truncate max-w-[80px]">{part}</span>
                  </Button>
                  {index < pathParts.length - 1 && <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
