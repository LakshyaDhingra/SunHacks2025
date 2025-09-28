"use client";

import { useState } from "react";
import Image from "next/image";
import { SignUpButton } from "@clerk/nextjs";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import NavPills from "./NavPills";

export default function NavBar() {

  return (
    <nav className="w-full bg-gradient-to-r from-maroon-500 to-yellow-600 px-6 py-4 shadow-md flex items-center justify-between">
      {/* Left side: Brand */}
      <div className="text-2xl font-bold text-white">
        <Image src="/logo_svg.svg" alt="Logo" width={100} height={100} />
      </div>

      {/* Center: Navigation Pills */}
      <NavPills
        items={[
          { label: 'Home', href: '/' },
          { label: 'Recipes', href: '/recipes' },
          { label: 'Test', href: '/test-extraction' },
          { label: 'About', href: '/about' }
        ]}
        className="hidden md:flex"
      />

      {/* Right side: User section */}
      <div className="flex items-center gap-4">
        <SignedOut>
          <SignInButton>
            <button
              className="bg-white text-[color:var(--background)] font-semibold px-4 py-2 rounded-full cursor-pointer transition-colors hover:bg-zinc-100"
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          <UserButton/>
        </SignedIn>
      </div>
    </nav>
  );
}
