"use client"

import * as React from "react"
import {
  IconCheck,
  IconCopy,
  IconCreditCard,
  IconFileText,
  IconKey,
  IconListDetails,
  IconReceipt,
  IconShieldCheck,
  IconTarget,
  IconWallet,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const serverUrl = "https://mcp.buffer.cash/api/mcp"

const claudeDesktopConfig = `{
  "mcpServers": {
    "buffer": {
      "command": "npx",
      "args": ["mcp-remote", "${serverUrl}"],
      "env": {
        "BUFFER_TOKEN": "buf_live_xxx"
      }
    }
  }
}`

const claudeCodeConfig = `{
  "mcpServers": {
    "buffer": {
      "command": "npx",
      "args": ["mcp-remote", "${serverUrl}"],
      "env": {
        "BUFFER_TOKEN": "buf_live_xxx"
      }
    }
  }
}`

const claudeCodeCli = `claude mcp add buffer --env BUFFER_TOKEN=buf_live_xxx -- npx mcp-remote ${serverUrl}`

const codexConfig = `[mcp_servers.buffer]
command = "npx"
args = ["mcp-remote", "${serverUrl}"]

[mcp_servers.buffer.env]
BUFFER_TOKEN = "buf_live_xxx"`

const agentTools = [
  {
    name: "buffer_status",
    description: "Check user verification, balance, and spending eligibility",
    icon: IconShieldCheck,
  },
  {
    name: "buffer_funding",
    description: "Check balance and get crypto deposit addresses",
    icon: IconWallet,
  },
  {
    name: "buffer_card",
    description: "Create, list, freeze, unfreeze, and close virtual cards",
    icon: IconCreditCard,
  },
  {
    name: "buffer_intent",
    description: "Declare and list spending intents",
    icon: IconTarget,
  },
  {
    name: "buffer_transactions",
    description: "List and get transaction details",
    icon: IconListDetails,
  },
  {
    name: "buffer_disputes",
    description: "File and manage transaction disputes",
    icon: IconFileText,
  },
  {
    name: "buffer_agents",
    description: "Create and manage AI spending agents",
    icon: IconReceipt,
  },
]

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 gap-1.5 text-xs"
      onClick={handleCopy}
    >
      {copied ? (
        <>
          <IconCheck className="size-3" />
          Copied
        </>
      ) : (
        <>
          <IconCopy className="size-3" />
          {label || "Copy"}
        </>
      )}
    </Button>
  )
}

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="bg-muted rounded-lg p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export function McpContent() {
  return (
    <div className="px-4 lg:px-6 space-y-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <p className="text-muted-foreground">
            Connect AI agents to Buffer via Model Context Protocol. Works with Claude Desktop, Cursor, and any MCP-compatible client.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Compatible with</span>
          <Badge variant="secondary" className="gap-1.5">
            <img src="/logos/claude.svg" alt="Claude" className="h-3.5 w-auto" />
            Claude
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <img src="/logos/claude-code.svg" alt="Claude Code" className="h-3.5 w-auto" />
            Claude Code
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <img src="/logos/cursor.svg" alt="Cursor" className="h-3.5 w-auto" />
            Cursor
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <img src="/logos/openai.svg" alt="ChatGPT" className="h-3.5 w-auto" />
            ChatGPT
          </Badge>
          <Badge variant="secondary" className="gap-1.5">
            <img src="/logos/openai.svg" alt="Codex" className="h-3.5 w-auto" />
            Codex
          </Badge>
        </div>
      </div>

      {/* Quick Connect */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Quick Connect</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Server URL */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Server URL
            </Label>
            <div className="flex gap-2">
              <Input
                value={serverUrl}
                readOnly
                className="font-mono text-sm"
              />
              <CopyButton text={serverUrl} />
            </div>
          </div>

          {/* Authentication */}
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Authentication
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <IconKey className="size-4 text-muted-foreground" />
                <span>Personal Token</span>
                <span className="text-muted-foreground">— Full access (all tools)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <IconShieldCheck className="size-4 text-muted-foreground" />
                <span>Agent Token</span>
                <span className="text-muted-foreground">— Agent tools only</span>
              </div>
            </div>
            <Button size="sm" className="gap-1.5">
              <IconKey className="size-3.5" />
              Create Token
            </Button>
          </div>
        </div>
      </div>

      {/* Client Configuration */}
      <div className="space-y-4">
        <Tabs defaultValue="claude" className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Clients
            </span>
            <TabsList>
              <TabsTrigger value="claude">Claude</TabsTrigger>
              <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="codex">Codex</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="claude" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add the MCP server via Claude Desktop settings. Use the config below or paste your API key.
            </p>
            <CodeBlock code={claudeDesktopConfig} label="Claude Desktop / Cursor Config" />
          </TabsContent>

          <TabsContent value="claude-code" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add the MCP server via the Claude Code CLI, or drop a project-level config. Use the CLI if you prefer user-wide or local scopes.
            </p>
            <CodeBlock code={claudeCodeConfig} label="Claude Code Config" />
            <CodeBlock code={claudeCodeCli} label="Claude Code CLI" />
          </TabsContent>

          <TabsContent value="cursor" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add the MCP server via Cursor settings. Use the same config as Claude Desktop.
            </p>
            <CodeBlock code={claudeDesktopConfig} label="Cursor Config" />
          </TabsContent>

          <TabsContent value="codex" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use the STDIO config to connect Codex. This uses mcp-remote and passes your API key via environment variables.
            </p>
            <CodeBlock code={codexConfig} label="Codex Config" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Agent Tools */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Agent Tools</h2>
          <Badge variant="secondary">{agentTools.length}</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agentTools.map((tool) => (
            <Card key={tool.name} className="bg-muted/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <tool.icon className="size-4 text-orange-500" />
                  <CardTitle className="text-sm font-medium">{tool.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs">
                  {tool.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
