"use client";

import { useState } from "react";
import Image from "next/image";

export default function NavBar() {
  const [user, setUser] = useState<{ name: string; avatar: string } | null>(
    null
  );

  return (
    <nav className="w-full bg-gradient-to-r from-maroon-500 to-yellow-600 px-6 py-4 shadow-md flex items-center justify-between">
      {/* Left side: Brand */}
      <div className="text-2xl font-bold text-white">
        <Image src="/logo_svg.svg" alt="Logo" width={100} height={100} />
      </div>

      {/* Right side: User section */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-white font-medium">{user.name}</span>
            <Image
              src={user.avatar}
              alt="User avatar"
              width={36}
              height={36}
              className="rounded-full border-2 border-white"
            />
            <button
              onClick={() => setUser(null)}
              className="bg-white text-yellow-600 font-semibold px-3 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() =>
              setUser({
                name: "User1",
                avatar: "/avatar.png",
              })
            }
            className="bg-white text-red-600 font-semibold px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
