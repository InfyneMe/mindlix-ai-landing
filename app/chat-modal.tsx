"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatModalProps = {
  initialPrompt: string;
  onClose: () => void;
};

const WELCOME =
  "I’m Mindlix AI. I can help you research a market, examine a decision, clarify demand, or structure a growth problem.";

export default function ChatModal({
  initialPrompt,
  onClose,
}: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState("");
  const [canRetry, setCanRetry] = useState(true);
  const initialPromptSent = useRef(false);
  const modalRef = useRef<HTMLElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendPrompt = useCallback(
    async (prompt: string, currentMessages: ChatMessage[]) => {
      const cleanPrompt = prompt.trim();
      if (!cleanPrompt || isThinking) return;

      const nextMessages = [
        ...currentMessages,
        { role: "user" as const, content: cleanPrompt },
      ];
      setMessages(nextMessages);
      setDraft("");
      setError("");
      setCanRetry(true);
      setIsThinking(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: nextMessages }),
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          message?: string;
          error?: string;
          retryable?: boolean;
        };

        if (!response.ok || !payload.message) {
          setCanRetry(payload.retryable !== false);
          throw new Error(
            payload.error ?? "Mindlix AI could not complete that response.",
          );
        }

        setMessages((current) => [
          ...current,
          { role: "assistant", content: payload.message as string },
        ]);
      } catch (requestError) {
        if ((requestError as Error).name === "AbortError") {
          initialPromptSent.current = false;
        } else {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Mindlix AI is temporarily unavailable. Please try again.",
          );
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setIsThinking(false);
      }
    },
    [isThinking],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          "button:not(:disabled), textarea:not(:disabled), [href], [tabindex]:not([tabindex='-1'])",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      abortRef.current?.abort();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking, error]);

  useEffect(() => {
    if (!isThinking && initialPromptSent.current) {
      composerRef.current?.focus();
    }
  }, [isThinking]);

  useEffect(() => {
    if (!initialPrompt.trim() || initialPromptSent.current) return;
    initialPromptSent.current = true;
    void sendPrompt(initialPrompt, messages);
  }, [initialPrompt, messages, sendPrompt]);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendPrompt(draft, messages);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function retryLastMessage() {
    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");
    if (!lastUserMessage) return;
    const historyWithoutLast = messages.slice(
      0,
      messages.lastIndexOf(lastUserMessage),
    );
    void sendPrompt(lastUserMessage.content, historyWithoutLast);
  }

  return (
    <div className="chat-backdrop" role="presentation">
      <section
        ref={modalRef}
        className="chat-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
        aria-describedby="chat-privacy"
      >
        <header className="chat-header">
          <div className="chat-identity">
            <span className="chat-mark" aria-hidden="true">
              M
            </span>
            <div>
              <div className="chat-title-row">
                <h2 id="chat-title">Mindlix AI</h2>
                <span>Beta</span>
              </div>
              <p>
                <i aria-hidden="true" /> Business intelligence assistant
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            className="chat-close"
            type="button"
            aria-label="Close Mindlix AI chat"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="chat-privacy" id="chat-privacy" role="status">
          <span aria-hidden="true">◇</span>
          <p>
            <strong>Session only · No chat history saved.</strong> This
            conversation clears when you close or refresh this page.
          </p>
        </div>

        <div
          className="chat-thread"
          ref={scrollRef}
          aria-live="polite"
          aria-busy={isThinking}
        >
          <div className="chat-date">
            <span>Current session</span>
          </div>

          {messages.map((message, index) => (
            <article
              className={`chat-message chat-message--${message.role}`}
              key={`${message.role}-${index}`}
            >
              <span className="chat-message-label">
                {message.role === "assistant" ? "Mindlix AI" : "You"}
              </span>
              <div>
                {message.content.split("\n").map((line, lineIndex) => (
                  <p key={`${line}-${lineIndex}`}>{line || "\u00a0"}</p>
                ))}
              </div>
            </article>
          ))}

          {isThinking && (
            <article className="chat-message chat-message--assistant chat-thinking">
              <span className="chat-message-label">Mindlix AI</span>
              <div aria-label="Mindlix AI is thinking">
                <i />
                <i />
                <i />
              </div>
            </article>
          )}

          {error && (
            <div className="chat-error" role="alert">
              <p>{error}</p>
              {canRetry && (
                <button type="button" onClick={retryLastMessage}>
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={submitMessage}>
          <label className="sr-only" htmlFor="mindlix-chat-input">
            Message Mindlix AI
          </label>
          <div className="chat-composer-shell">
            <textarea
              ref={composerRef}
              id="mindlix-chat-input"
              rows={1}
              maxLength={4000}
              value={draft}
              placeholder="Ask a follow-up question…"
              disabled={isThinking}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
            />
            <button
              type="submit"
              disabled={isThinking || !draft.trim()}
              aria-label="Send message"
            >
              <span aria-hidden="true">↑</span>
            </button>
          </div>
          <div className="chat-composer-meta">
            <span>Enter to send · Shift + Enter for a new line</span>
            <span>AI can make mistakes. Verify important decisions.</span>
          </div>
        </form>
      </section>
    </div>
  );
}
