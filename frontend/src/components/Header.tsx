"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation' 
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const isMarketing = pathname === '/'

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#EFE9D5]/80 backdrop-blur-sm border-b-2 border-border h-14">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Link 
              href={session ? "/home" : "/"} 
              className="flex items-center gap-2"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#c1ff72] rounded-sm flex items-center justify-center border-2 border-b-3 border-r-3 border-black">
                <span className="text-black text-base sm:text-xl">🎓</span>
              </div>
              <span className="font-semibold text-sm sm:text-base">Mind Mentor</span>
            </Link>
          </div>
          
          <nav className="flex items-center space-x-2 sm:space-x-4">
            {isMarketing ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link 
                        href="https://github.com/KartikLabhshetwar/mind-mentor" 
                        target="_blank"
                        className="hidden sm:inline-block px-4 py-1.5 bg-[#c1ff72] border-2 border-b-4 border-r-4 border-black rounded-lg hover:bg-[#c1ff72] hover:border-b-2 hover:border-r-2 transition-all duration-100 text-sm font-medium shadow-sm hover:shadow active:border-b-2 active:border-r-2"
                      >
                        GitHub
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Star on GitHub</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {!session ? (
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      onClick={() => signIn()}
                      className="border-2 border-black text-xs sm:text-sm px-2 sm:px-4"
                    >
                      Sign In
                    </Button>
                    <Link href="/register" passHref>
                      <button className="px-2 sm:px-4 py-1.5 bg-[#c1ff72] border-2 border-b-4 border-r-4 border-black rounded-lg hover:bg-[#c1ff72] hover:border-b-2 hover:border-r-2 transition-all duration-100 text-xs sm:text-sm font-medium shadow-sm hover:shadow active:border-b-2 active:border-r-2">
                        Sign Up
                      </button>
                    </Link>
                  </div>
                ) : null}
              </>
            ) : null}

            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 bg-[#F2EDE0]">
                      <AvatarImage 
                        src={session.user?.image || "/images/default-avatar.png"} 
                        alt={session.user?.name || '@user'} 
                      />
                      <AvatarFallback>{session.user?.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 sm:w-56 border-2 border-black" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-xs sm:text-sm font-medium leading-none">{session.user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => handleNavigation('/profile')} className="text-xs sm:text-sm">
                      Profile
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-xs sm:text-sm">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  )
}