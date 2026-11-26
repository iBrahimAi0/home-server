"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { FileArchive, Upload, X } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "../ui/Toast";

type Props = { isOpen: boolean; onClose: () => void; onCreated: (id: string) => void };

export function CreateBotModal({ isOpen, ...props }: Props) {
  return isOpen ? <CreateProject {...props}/> : null;
}

function CreateProject({ onClose, onCreated }: Omit<Props, "isOpen">) {
  const toast = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [zip, setZip] = useState<File | null>(null);
  const [source, setSource] = useState("zip");
  const [env, setEnv] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  function selectArchive(files: FileList | null) {
    if (!files?.length) return;
    const file = files[0];
    if (files.length !== 1 || !/\.zip$/i.test(file.name) || file.size === 0 || file.size > 80 * 1024 * 1024) {
      setError("Choose one ZIP file up to 80 MiB.");
      return;
    }
    setZip(file);
    setError("");
    if (!name.trim() || name === zip?.name.replace(/\.zip$/i, "")) setName(file.name.replace(/\.zip$/i, ""));
  }

  async function deploy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const fields = new FormData(event.currentTarget);
    const id = name.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
    if (!id || (source === "zip" && !zip)) {
      setError("Enter a project name and select the required ZIP.");
      return;
    }

    setBusy(true);
    setError("");
    let created = false;
    try {
      const command = String(fields.get("command") || "").trim().split(/\s+/).filter(Boolean);
      const autoStart = fields.has("start") && source !== "empty";
      await api.createBot({
        id, name: name.trim(), description: String(fields.get("description") || ""),
        command: command[0], args: command.length ? command.slice(1) : undefined,
        projectArchive: source === "zip" ? zip! : undefined,
        template: source === "template" ? String(fields.get("template")) : undefined,
        envText: source !== "git" ? env : undefined,
        installDependencies: source !== "git" && source !== "empty",
        autoStart: source !== "git" && autoStart,
      });
      created = true;
      if (source === "git") {
        const branch = String(fields.get("branch") || "main").trim() || "main";
        await api.configureGitRepo(id, String(fields.get("repo")).trim(), branch);
        await api.pullGit(id, branch);
        if (env.trim()) await api.updateBotEnvText(id, env);
        if (autoStart) {
          await api.installDependencies(id);
          await api.updateBot(id, { autoStart: true });
          await api.startBot(id);
        }
      }
      onCreated(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Deployment failed.";
      if (created) {
        toast.error("Project created. Finish Git setup from the project page. " + message);
        onCreated(id);
      } else setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="deploy-title" className="forge-card forge-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 id="deploy-title" className="text-2xl font-semibold">Deploy a bot</h2>
        <button type="button" className="forge-btn-dark" disabled={busy} onClick={onClose} aria-label="Close"><X size={17}/></button>
      </div>
      <form onSubmit={deploy}>
        <fieldset className="space-y-4 p-5" disabled={busy}>
          <label className="forge-label">Project source<select className="forge-input" value={source} onChange={event => { setSource(event.target.value); setError(""); }}>
            <option value="zip">Upload a ZIP</option><option value="git">Git repository</option><option value="template">Starter template</option><option value="empty">Empty project</option>
          </select></label>
          {source === "zip" && <>
            <input ref={picker} type="file" accept=".zip" hidden onChange={event => { selectArchive(event.target.files); event.target.value = ""; }}/>
            <button type="button" className="grid w-full cursor-pointer justify-items-center gap-2 rounded-lg border border-dashed border-neutral-500 bg-inset p-5 hover:border-gold"
              onClick={() => picker.current?.click()} onDragOver={event => event.preventDefault()}
              onDrop={event => { event.preventDefault(); selectArchive(event.dataTransfer.files); }}>
              {zip ? <FileArchive className="text-gold" size={22}/> : <Upload className="text-gold" size={22}/>}
              <strong className="break-all">{zip?.name || "Choose or drop a ZIP"}</strong>
              <span className="text-sm text-neutral-400">{zip ? "Click to replace" : "Node.js or Python · up to 80 MiB"}</span>
            </button>
          </>}
          {source === "git" && <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
            <label className="forge-label">Repository URL<input className="forge-input" name="repo" type="url" required/></label>
            <label className="forge-label">Branch<input className="forge-input" name="branch" defaultValue="main"/></label>
          </div>}
          {source === "template" && <label className="forge-label">Template<select className="forge-input" name="template">
            <option value="discordjs">Discord.js</option><option value="discordpy">Discord.py</option><option value="typescript">TypeScript</option><option value="minimal">Minimal Node.js service</option>
          </select></label>}
          <label className="forge-label">Project name<input className="forge-input" required value={name} maxLength={80} onChange={event => setName(event.target.value)}/></label>
          <details className="rounded-lg border border-line p-3">
            <summary className="cursor-pointer font-semibold">Environment variables <span className="text-sm text-neutral-400">(optional)</span></summary>
            <label className="forge-label mt-3">Paste .env values<textarea className="forge-input font-mono text-sm" rows={3} value={env} spellCheck={false} placeholder="DISCORD_TOKEN=…" onChange={event => setEnv(event.target.value)}/></label>
            <label className="mt-2 block text-sm">Import .env <input type="file" onChange={async event => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (file.size > 1024 * 1024) { setError("Choose an environment file under 1 MiB."); return; }
              try { setEnv(await file.text()); setError(""); } catch { setError("Couldn’t read the environment file."); }
            }}/></label>
          </details>
          <details><summary className="cursor-pointer text-sm">Startup command and description</summary>
            <label className="forge-label mt-3">Startup command<input className="forge-input" name="command" placeholder="Detect from project"/></label>
            <label className="forge-label mt-2">Description<input className="forge-input" name="description"/></label>
          </details>
          {source !== "empty" && <label className="flex items-center gap-2"><input key={source} name="start" type="checkbox" defaultChecked={source === "zip"}/> Start when ready and on host boot</label>}
          {error && <p role="alert" className="text-rose-300">{error}</p>}
          <button className="forge-btn-primary min-h-11 w-full" disabled={busy || (source === "zip" && !zip)}>{busy ? "Creating project…" : "Create project"}</button>
        </fieldset>
      </form>
    </dialog>
  );
}
