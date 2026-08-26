import type { Plugin } from "@opencode-ai/plugin"

interface TodoItem {
    status?: string
}

/**
 * 実装が完了した時点(session.idle)で、変更があればローカルにコミットする。
 * pushは行わない。todowrite のタスクが残っている間は完了を待ってからコミットする。
 */
export const AutoCommitPlugin: Plugin = async ({ client, $, directory, worktree }) => {
    let committing = false
    let hasTodos = false
    let todosComplete = true

    const log = async (level: "debug" | "info" | "warn" | "error", message: string) => {
        try {
            await client.app.log({ body: { service: "auto-commit", level, message } })
        } catch {
            // logging must never break the hook
        }
    }

    return {
        event: async ({ event }) => {
            if (event.type === "todo.updated") {
                const props = event.properties as { todos?: TodoItem[] } | undefined
                const todos = props?.todos ?? []
                hasTodos = todos.length > 0
                todosComplete = todos.every((t) => t.status === "completed")
                return
            }

            if (event.type !== "session.idle") return
            if (committing) return
            committing = true
            try {
                const wt = worktree || directory
                if (!wt) return

                // タスクが未完了のままならまだコミットしない
                if (hasTodos && !todosComplete) {
                    await log("debug", "skip commit: todos incomplete")
                    return
                }

                const inside = await $`git -C ${wt} rev-parse --is-inside-work-tree`
                    .nothrow()
                    .text()
                if (inside.trim() !== "true") return

                const status = await $`git -C ${wt} status --porcelain`.nothrow().text()
                if (!status.trim()) return

                // マージ/リベース中は触らない
                const mergeHead = await $`git -C ${wt} rev-parse -q --verify MERGE_HEAD`.nothrow()
                if (mergeHead.exitCode === 0) {
                    await log("warn", "skip commit: merge in progress")
                    return
                }

                const files = status
                    .trim()
                    .split("\n")
                    .map((line) => line.slice(3).trim())
                const summary = `${files.length} file(s): ${files.slice(0, 3).join(", ")}${files.length > 3 ? ", ..." : ""}`

                await $`git -C ${wt} add -A`
                const commit = await $`git -C ${wt} commit -m ${`auto: ${summary}`}`.nothrow()
                if (commit.exitCode !== 0) {
                    const output = await commit.text()
                    await log("warn", `commit failed: ${output}`)
                    return
                }
                await log("info", `committed: auto: ${summary}`)
            } catch (error) {
                await log("error", `auto-commit failed: ${error instanceof Error ? error.message : String(error)}`)
            } finally {
                committing = false
            }
        },
    }
}
