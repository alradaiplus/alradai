"use client";

import { useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { NODE_TYPE_META, type NodeType } from "@/lib/types";
import {
  FileText,
  CircleCheck,
  FolderKanban,
  Telescope,
  Mic,
  Image as ImageIcon,
  FileType2,
  Link2,
  Sparkles,
  Share2,
  Home,
  CheckSquare,
  Plus,
  Wand2,
  Layers,
  Folder,
  Video,
  Code2,
  PenTool,
  Network,
  Bookmark,
  CalendarClock,
  Workflow,
  AppWindow,
} from "lucide-react";

const CREATE: { type: NodeType; label: string; icon: React.ReactNode }[] = [
  { type: "note", label: "New note", icon: <FileText size={15} /> },
  { type: "task", label: "New task", icon: <CircleCheck size={15} /> },
  { type: "project", label: "New project", icon: <FolderKanban size={15} /> },
  { type: "research", label: "New research", icon: <Telescope size={15} /> },
  { type: "voice", label: "New voice note", icon: <Mic size={15} /> },
  { type: "image", label: "New image", icon: <ImageIcon size={15} /> },
  { type: "pdf", label: "New PDF", icon: <FileType2 size={15} /> },
  { type: "link", label: "New link", icon: <Link2 size={15} /> },
  { type: "ai", label: "New AI node", icon: <Sparkles size={15} /> },
  { type: "folder", label: "New folder", icon: <Folder size={15} /> },
  { type: "video", label: "New video", icon: <Video size={15} /> },
  { type: "code", label: "New code snippet", icon: <Code2 size={15} /> },
  { type: "whiteboard", label: "New whiteboard", icon: <PenTool size={15} /> },
  { type: "mindmap", label: "New mind map", icon: <Network size={15} /> },
  { type: "bookmark", label: "New bookmark", icon: <Bookmark size={15} /> },
  { type: "event", label: "New calendar event", icon: <CalendarClock size={15} /> },
  { type: "workflow", label: "New workflow", icon: <Workflow size={15} /> },
  { type: "embed", label: "New embed", icon: <AppWindow size={15} /> },
];

/**
 * ⌘K command palette — search over all nodes plus quick actions: create any
 * node type, switch boards, run AI relationship discovery, and navigate.
 */
export function CommandPalette() {
  const open = useStore((s) => s.commandOpen);
  const setOpen = useStore((s) => s.setCommandOpen);
  const nodes = useStore((s) => s.nodes);
  const boards = useStore((s) => s.boards);
  const select = useStore((s) => s.select);
  const selectBoard = useStore((s) => s.selectBoard);
  const addNode = useStore((s) => s.addNode);
  const addBoard = useStore((s) => s.addBoard);
  const discoverLinks = useStore((s) => s.discoverLinks);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) return null;

  const create = (type: NodeType) => {
    const titles: Partial<Record<NodeType, string>> = {
      note: "New note",
      task: "New task",
      project: "New project",
      research: "Research question",
      voice: "Voice note",
      image: "New image",
      pdf: "New PDF",
      link: "New link",
      ai: "Ask AI",
      folder: "New folder",
      video: "New video",
      code: "Code snippet",
      whiteboard: "Whiteboard",
      mindmap: "Mind map",
      bookmark: "New bookmark",
      event: "New event",
      workflow: "Workflow",
      embed: "Embed",
    };
    const linkLike = type === "link" || type === "bookmark" || type === "embed" || type === "video";
    addNode({
      type,
      title: titles[type] ?? "New node",
      content:
        type === "note"
          ? "Start writing…"
          : type === "code"
          ? "// code"
          : "",
      src:
        type === "image"
          ? "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=70"
          : linkLike
          ? "https://"
          : undefined,
    });
    router.push("/app");
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center bg-black/60 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-full max-w-xl animate-fade-in overflow-hidden rounded-2xl border border-canvas-border bg-canvas-panel shadow-panel"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <Command.Input
          autoFocus
          placeholder="Search nodes, switch boards, or run a command…"
          className="w-full border-b border-canvas-border bg-transparent px-4 py-3.5 text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
        <Command.List className="max-h-[55vh] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-[13px] text-ink-faint">
            No results.
          </Command.Empty>

          <Group heading="Create">
            {CREATE.map((c) => (
              <Item key={c.type} onSelect={() => create(c.type)} icon={c.icon}>
                {c.label}
              </Item>
            ))}
          </Group>

          <Group heading="Actions">
            <Item
              onSelect={() => {
                const n = discoverLinks();
                router.push("/app");
                setOpen(false);
                if (typeof window !== "undefined")
                  setTimeout(
                    () =>
                      alert(
                        n
                          ? `Found ${n} suggested connection${n > 1 ? "s" : ""}. Open a node to review.`
                          : "No new connections found on this board."
                      ),
                    50
                  );
              }}
              icon={<Wand2 size={15} />}
            >
              Discover links (AI)
            </Item>
            <Item
              onSelect={() => {
                addBoard();
                router.push("/app");
                setOpen(false);
              }}
              icon={<Plus size={15} />}
            >
              New board
            </Item>
            <Item
              onSelect={() => {
                router.push("/app/tasks");
                setOpen(false);
              }}
              icon={<CheckSquare size={15} />}
            >
              Open Tasks
            </Item>
            <Item
              onSelect={() => {
                router.push("/app/graph");
                setOpen(false);
              }}
              icon={<Share2 size={15} />}
            >
              Open Knowledge Graph
            </Item>
            <Item
              onSelect={() => {
                router.push("/app");
                setOpen(false);
              }}
              icon={<Home size={15} />}
            >
              Go to canvas
            </Item>
          </Group>

          <Group heading="Boards">
            {boards.map((b) => (
              <Item
                key={b.id}
                value={`board ${b.title}`}
                onSelect={() => {
                  selectBoard(b.id);
                  router.push("/app");
                  setOpen(false);
                }}
                icon={<Layers size={15} />}
              >
                {b.title}
              </Item>
            ))}
          </Group>

          <Group heading="Nodes">
            {nodes.map((n) => (
              <Item
                key={n.id}
                value={`${n.title} ${n.content} ${n.tags.join(" ")}`}
                onSelect={() => {
                  selectBoard(n.boardId);
                  select(n.id);
                  router.push("/app");
                  setOpen(false);
                }}
                icon={
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ background: NODE_TYPE_META[n.type].color }}
                  />
                }
              >
                <span className="flex-1 truncate">{n.title}</span>
                <span className="ml-2 truncate text-[11px] text-ink-faint">
                  {NODE_TYPE_META[n.type].label}
                </span>
              </Item>
            ))}
          </Group>
        </Command.List>
        <div className="flex items-center gap-2 border-t border-canvas-border px-3 py-2 text-[11px] text-ink-faint">
          <Sparkles size={12} className="text-accent" />
          Hybrid search · full-text + semantic
        </div>
      </Command>
    </div>
  );
}

function Group({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Command.Group
      heading={heading}
      className="px-2 text-[11px] uppercase tracking-wide text-ink-faint [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1.5"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  children,
  onSelect,
  icon,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon: React.ReactNode;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-muted aria-selected:bg-canvas-hover aria-selected:text-ink"
    >
      {icon}
      {children}
    </Command.Item>
  );
}
