import { forwardRef } from 'react';
import styles from './AboutModal.module.css';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal = forwardRef<HTMLDialogElement, AboutModalProps>(function AboutModal(
  { onClose },
  ref,
) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog ref={ref} className={styles.dialog} onClick={handleBackdropClick} onClose={onClose}>
      <header className={styles.header}>
        <h2 className={styles.title}>About</h2>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </header>
      <div className={styles.body}>
        <p>
          In the beginning there was the Spec, and the Spec was without form, and void.
          And the developer said <em>&ldquo;Let there be JSON&rdquo;</em>, and there was JSON,
          and it was… adequate. <strong>Ivory Tower</strong> is what happened next: a tool
          for writing project specifications so complete that an AI can read them and build
          the whole thing — no ambiguity, no hand-waving, no hoping the intern understands
          what &ldquo;make it work like the other one&rdquo; means.
        </p>
        <p>
          You describe your entities, relationships, use cases, endpoints, and business rules
          in one document. Ivory Tower validates it, visualises it, and exports it as TOON,
          Mermaid, SVG, or JSON — whichever dialect your AI overlords prefer. The diagram
          exists purely so <em>you</em>, the human, can squint at it and confirm that nobody
          has accidentally made the <code>User</code> entity inherit
          from <code>Sandwich</code>.
        </p>
        <p className={styles.credit}>
          Brought into being by David Ramos Calvo — a man who looked at the state of software
          architecture tooling, said &ldquo;I&apos;m not angry, just disappointed&rdquo;, and
          then was, in fact, also angry. Any resemblance to actual good software practices is
          entirely intentional.
        </p>
        <p className={styles.meta}>
          v0.1.0 · MIT License · Don&apos;t Panic
        </p>
      </div>
    </dialog>
  );
});
