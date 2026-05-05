import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import TextareaAutosize from "react-textarea-autosize";
import { useHotkeys } from "react-hotkeys-hook";
import { Popover } from "@base-ui/react/popover";

import { Container } from "../container";

import styles from "./app.module.css";
import { cn } from "@/helpers/styles";
import { useLocalStorage } from "@/hooks/use-local-storage";

const PROMPTS = [
  "What’s bothering you most right now?",
  "What are you avoiding?",
  "What feels unclear?",
  "What’s taking up mental space?",
  "What do you keep thinking about?",
  "What would make today better?",
];

interface Line {
  id: ReturnType<typeof crypto.randomUUID>;
  text: string;
  createdAt: number;
  sessionId: number;
}

export function App() {
  const [promptIndex, setPromptIndex] = useState(0);

  const [value, setValue] = useLocalStorage("braindump-value", "");
  const [lines, setLines] = useLocalStorage<Array<Line>>("braindump-lines", []);

  const [sessionId, setSessionId] = useState(Date.now());
  const lastEntryTimeRef = useRef<number | null>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mounted = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [lines]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    setIsTyping(true);

    const timeout = setTimeout(() => {
      setIsTyping(false);
      setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [value]);

  useHotkeys("mod+z", () => {
    if (value) return setValue("");

    if (lines.length > 0) {
      const lastLine = lines.slice(-1)[0];

      setLines((prev) => prev.slice(0, -1));
      setValue(lastLine.text);

      inputRef.current?.focus();
    }
  });

  const linesAsText = lines.map((line) => line.text).join("\n");
  const hasLines = lines.length > 0;

  const closeMenu = () => setIsMenuOpen(false);

  const copyLines = async () => {
    if (!hasLines) return;

    try {
      await navigator.clipboard.writeText(linesAsText);
    } catch {
      const temp = document.createElement("textarea");
      temp.value = linesAsText;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.focus();
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
    }

    closeMenu();
  };

  const downloadLines = () => {
    if (!hasLines) return;

    const blob = new Blob([linesAsText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    anchor.href = url;
    anchor.download = `braindump-${stamp}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    closeMenu();
  };

  const clearLines = () => {
    setLines([]);
    closeMenu();
  };

  return (
    <>
      <div className={cn(styles.overlay, styles.top)} />

      <Container>
        <div className={styles.toolbar}>
          <h1>Braindump.</h1>
          <Popover.Root open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Popover.Trigger
              className={styles.menuTrigger}
              aria-label="Open menu"
            >
              Menu
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                align="center"
                sideOffset={8}
                className={styles.menuPositioner}
              >
                <Popover.Popup className={styles.menu}>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={copyLines}
                    disabled={!hasLines}
                  >
                    Copy as text
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={downloadLines}
                    disabled={!hasLines}
                  >
                    Download .txt
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    onClick={clearLines}
                    disabled={!hasLines}
                  >
                    Clear lines
                  </button>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>

        <section className={styles.lines}>
          {lines.map((line, i) => {
            const prev = lines[i - 1];
            const isNewSession = !prev || prev.sessionId !== line.sessionId;

            return (
              <div key={i}>
                {isNewSession && <SessionDivider timestamp={line.createdAt} />}

                <Line text={line.text} index={i} total={lines.length} />
              </div>
            );
          })}
        </section>

        <TextareaAutosize
          ref={inputRef}
          minRows={1}
          className={styles.input}
          placeholder="What is on you mind?"
          value={value}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              if (value.trim().length === 0) return;

              const now = Date.now();
              const INACTIVITY_THRESHOLD = 1000 * 60 * 30; // 30 mins

              const shouldStartNewSession =
                lastEntryTimeRef.current &&
                now - lastEntryTimeRef.current > INACTIVITY_THRESHOLD;
              const nextSessionId = shouldStartNewSession ? now : sessionId;

              if (shouldStartNewSession) {
                setSessionId(nextSessionId);
              }

              lastEntryTimeRef.current = now;

              setLines((prev) => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  text: value,
                  sessionId: nextSessionId,
                  createdAt: now,
                },
              ]);
              setValue("");
            }
          }}
          onChange={(e) => {
            setHasTyped(true);
            setIsTyping(true);
            setValue(e.target.value);
          }}
        />
        <p
          className={styles.prompt}
          style={{
            opacity: isTyping || !hasTyped || value.trim().length === 0 ? 0 : 1,
          }}
        >
          {PROMPTS[promptIndex]}
        </p>
        <div className={styles.spacer} />
        <div ref={bottomRef} />
      </Container>
    </>
  );
}

function Line({
  text,
  index,
  total,
}: {
  text: string;
  index: number;
  total: number;
}) {
  const distance = total - 1 - index;

  let opacity = 1;
  let blur = 0;
  const scale = distance === 0 ? 1 : 0.98;

  if (distance === 0) {
    opacity = 1;
    blur = 0;
  } else if (distance === 1) {
    opacity = 0.8;
    blur = 1;
  } else {
    opacity = Math.max(0.4, 1 - distance * 0.15);
    blur = Math.min(6, distance * 1.5);
  }

  return (
    <motion.p
      initial={{ opacity: 1, filter: "blur(0px)" }}
      animate={{
        opacity,
        scale,
        filter: `blur(${blur}px)`,
        transition: { duration: 0.4 },
      }}
      whileHover={{
        opacity: 1,
        scale: 1,
        filter: "blur(0px)",
        transition: { duration: 0.1 },
      }}
      className={styles.line}
    >
      {text}
    </motion.p>
  );
}

function SessionDivider({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp);

  const label = date.toLocaleString([], {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 0.4, y: 0 }}
      className={styles.session}
    >
      <span>{label}</span>
    </motion.div>
  );
}
