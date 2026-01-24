"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

export function VerificationBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 px-6 py-6 md:px-8">
      {/* Purple glow effect */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl" />

      {/* Verification badge image */}
      <div className="hidden md:block absolute right-6 bottom-0">
        <Image
          src="/emojis.com verify-tiktok.png"
          alt="Verification badge"
          width={130}
          height={130}
          className="drop-shadow-2xl"
        />
      </div>

      <div className="relative flex items-center justify-between gap-6 md:pr-36">
        {/* Text content */}
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-white md:text-2xl">
            Complete verification to unlock multi-currency accounts and free transfers.
          </h3>
          <p className="text-sm text-zinc-400 md:text-base">
            One quick step to access all Slate features.
          </p>
          <div className="mt-2">
            <Button
              variant="secondary"
              className="bg-zinc-700/80 text-white hover:bg-zinc-600 border-0"
            >
              Begin ID verification
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
