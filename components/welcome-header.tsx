"use client"

export function WelcomeHeader() {
  const now = new Date()
  const hour = now.getHours()

  let greeting = "Good morning"
  if (hour >= 12 && hour < 17) {
    greeting = "Good afternoon"
  } else if (hour >= 17) {
    greeting = "Good evening"
  }

  const formattedDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex flex-col gap-1 px-4 lg:px-6">
      <h1 className="text-2xl font-semibold">{greeting}, Lyzbeth</h1>
      <p className="text-sm text-muted-foreground">{formattedDate}</p>
    </div>
  )
}
