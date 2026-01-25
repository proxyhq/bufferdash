"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { VerificationModal } from "@/components/verification-modal"

export function VerificationBanner() {
  const [modalOpen, setModalOpen] = useState(false)
  const verificationState = useQuery(api.users.getVerificationState)
  const hasAutoOpened = useRef(false)

  // Auto-open modal for new users or when verification just completed
  useEffect(() => {
    if (!verificationState) return

    // Auto-open for new users
    if (
      verificationState.verificationStatus === "not_started" &&
      !hasAutoOpened.current
    ) {
      const timer = setTimeout(() => {
        setModalOpen(true)
        hasAutoOpened.current = true
      }, 500)
      return () => clearTimeout(timer)
    }

    // Auto-open to show success when verification completes
    if (
      verificationState.verificationStatus === "approved" &&
      !hasAutoOpened.current
    ) {
      setModalOpen(true)
      hasAutoOpened.current = true
    }
  }, [verificationState])

  // Don't show banner if loading or approved
  if (verificationState === undefined) return null
  if (verificationState?.verificationStatus === "approved") return null

  const getStatusMessage = () => {
    switch (verificationState?.verificationStatus) {
      case "under_review":
        return "Your verification is being reviewed. We'll notify you when it's complete."
      case "rejected":
        return "Verification failed. Please contact support for assistance."
      case "tos_pending":
      case "kyc_pending":
        return "Continue your verification to unlock all features."
      default:
        return "One quick step to access all Slate features."
    }
  }

  const getButtonText = () => {
    switch (verificationState?.verificationStatus) {
      case "tos_pending":
        return "Continue verification"
      case "kyc_pending":
        return "Complete verification"
      case "under_review":
        return "View status"
      case "rejected":
        return "Contact support"
      default:
        return "Begin ID verification"
    }
  }

  return (
    <>
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
              Complete verification to unlock multi-currency accounts and free
              transfers.
            </h3>
            <p className="text-sm text-zinc-400 md:text-base">
              {getStatusMessage()}
            </p>
            <div className="mt-2">
              <Button
                variant="secondary"
                className="bg-zinc-700/80 text-white hover:bg-zinc-600 border-0"
                onClick={() => setModalOpen(true)}
              >
                {getButtonText()}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <VerificationModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
