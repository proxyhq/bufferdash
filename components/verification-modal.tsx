"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useAction } from "convex/react"
import { api } from "@/convex/_generated/api"
import confetti from "canvas-confetti"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  IconCheck,
  IconLoader2,
  IconExternalLink,
  IconShieldCheck,
  IconAlertCircle,
  IconConfetti,
} from "@tabler/icons-react"

interface VerificationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = "welcome" | "tos" | "kyc" | "pending" | "success" | "error"

// Confetti burst function
const fireConfetti = () => {
  const duration = 3000
  const end = Date.now() + duration

  const colors = ["#a855f7", "#3b82f6", "#22c55e", "#eab308", "#ec4899"]

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  // Initial burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: colors,
  })

  frame()
}

export function VerificationModal({
  open,
  onOpenChange,
}: VerificationModalProps) {
  const verificationState = useQuery(api.users.getVerificationState)
  const initializeOnboarding = useAction(api.kycLinks.initializeOnboarding)

  const [step, setStep] = useState<Step>("welcome")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [links, setLinks] = useState<{
    tosLink?: string
    kycLink?: string
  } | null>(null)
  const hasShownConfetti = useRef(false)

  // Sync step with backend state
  useEffect(() => {
    if (!verificationState) return

    switch (verificationState.verificationStatus) {
      case "not_started":
        setStep("welcome")
        break
      case "tos_pending":
        setStep("tos")
        if (verificationState.kycLink) {
          setLinks({
            tosLink: verificationState.kycLink.tosLink,
            kycLink: verificationState.kycLink.kycLink,
          })
        }
        break
      case "kyc_pending":
        setStep("kyc")
        if (verificationState.kycLink) {
          setLinks({
            tosLink: verificationState.kycLink.tosLink,
            kycLink: verificationState.kycLink.kycLink,
          })
        }
        break
      case "under_review":
        setStep("pending")
        break
      case "approved":
        setStep("success")
        // Fire confetti when reaching success state
        if (open && !hasShownConfetti.current) {
          hasShownConfetti.current = true
          setTimeout(() => fireConfetti(), 100)
        }
        break
      case "rejected":
        setStep("error")
        break
    }
  }, [verificationState, open])

  // Reset confetti flag when modal closes
  useEffect(() => {
    if (!open) {
      hasShownConfetti.current = false
    }
  }, [open])

  const handleStartVerification = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await initializeOnboarding({})
      setLinks({ tosLink: result.tosLink, kycLink: result.kycLink })

      // Check the returned status to determine next step
      if (result.kycStatus === "approved") {
        setStep("success")
        setTimeout(() => fireConfetti(), 100)
      } else if (result.kycStatus === "under_review") {
        setStep("pending")
      } else if (
        result.tosStatus === "approved" &&
        result.kycStatus === "not_started"
      ) {
        setStep("kyc")
      } else {
        setStep("tos")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start verification"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenTosLink = () => {
    if (links?.tosLink) {
      window.open(links.tosLink, "_blank")
    }
  }

  const handleOpenKycLink = () => {
    if (links?.kycLink) {
      window.open(links.kycLink, "_blank")
    }
  }

  const handleTosCompleted = () => {
    setStep("kyc")
  }

  const renderContent = () => {
    switch (step) {
      case "welcome":
        return (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                <IconShieldCheck className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              <DialogTitle className="text-xl">Verify Your Identity</DialogTitle>
              <DialogDescription className="mt-2">
                Complete a quick verification to unlock multi-currency accounts,
                free transfers, and all Slate features.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-muted/50 p-4">
                <h4 className="font-medium">What you will need:</h4>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>- Government-issued ID (passport, drivers license)</li>
                  <li>- About 5 minutes to complete</li>
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={handleStartVerification}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  "Begin Verification"
                )}
              </Button>
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>
          </>
        )

      case "tos":
        return (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex items-center gap-2">
                <StepIndicator number={1} active />
                <div className="h-px w-8 bg-muted" />
                <StepIndicator number={2} />
              </div>
              <DialogTitle>Accept Terms of Service</DialogTitle>
              <DialogDescription>
                Review and accept the terms of service to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={handleOpenTosLink}
              >
                Open Terms of Service
                <IconExternalLink className="h-4 w-4" />
              </Button>
              <Button className="w-full" onClick={handleTosCompleted}>
                I have accepted the terms
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                After accepting, you will be redirected back here.
              </p>
            </div>
          </>
        )

      case "kyc":
        return (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex items-center gap-2">
                <StepIndicator number={1} completed />
                <div className="h-px w-8 bg-violet-500" />
                <StepIndicator number={2} active />
              </div>
              <DialogTitle>Verify Your Identity</DialogTitle>
              <DialogDescription>
                Complete identity verification with our secure partner.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <Button
                className="w-full justify-between"
                onClick={handleOpenKycLink}
              >
                Start ID Verification
                <IconExternalLink className="h-4 w-4" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Verification typically takes 2-3 minutes. You will be notified
                when complete.
              </p>
            </div>
          </>
        )

      case "pending":
        return (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <IconLoader2 className="h-8 w-8 text-amber-600 dark:text-amber-400 animate-spin" />
              </div>
              <DialogTitle>Verification in Progress</DialogTitle>
              <DialogDescription>
                We are reviewing your information. This usually takes a few
                minutes but can take up to 24 hours.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Close and check back later
              </Button>
            </div>
          </>
        )

      case "success":
        return (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/25">
                <IconCheck className="h-10 w-10 text-white" strokeWidth={3} />
              </div>
              <DialogTitle className="text-2xl">
                You&apos;re Verified!
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                Welcome to Slate! Your account is fully set up with a personal
                wallet and USD deposit account.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/10 p-4 text-center">
                <p className="text-sm font-medium text-foreground">
                  What&apos;s ready for you:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Solana wallet for receiving crypto</li>
                  <li>USD bank account for deposits</li>
                  <li>Multi-currency conversion</li>
                </ul>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600"
                onClick={() => onOpenChange(false)}
              >
                <IconConfetti className="mr-2 h-4 w-4" />
                Let&apos;s Go!
              </Button>
            </div>
          </>
        )

      case "error":
        return (
          <>
            <DialogHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <IconAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle>Verification Failed</DialogTitle>
              <DialogDescription>
                We could not verify your identity. Please contact support for
                assistance.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>
          </>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={step !== "pending"}>
        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}

function StepIndicator({
  number,
  active,
  completed,
}: {
  number: number
  active?: boolean
  completed?: boolean
}) {
  return (
    <div
      className={`
      flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium
      ${completed ? "bg-violet-500 text-white" : ""}
      ${active && !completed ? "border-2 border-violet-500 text-violet-500" : ""}
      ${!active && !completed ? "border-2 border-muted text-muted-foreground" : ""}
    `}
    >
      {completed ? <IconCheck className="h-4 w-4" /> : number}
    </div>
  )
}
