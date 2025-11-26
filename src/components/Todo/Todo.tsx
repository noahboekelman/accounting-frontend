"use client";

import React from "react";
import styles from "./Todo.module.css";

type Todo = {
  id: number | string;
  title: string;
  done?: boolean;
};

export default function TodoDropdown({
  todo,
  currentStepId,
  open: openProp,
  setOpen: setOpenProp,
}: {
  todo: Todo[];
  currentStepId: number | null;
  open?: boolean;
  setOpen?: (v: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const items: Todo[] = Array.isArray(todo) ? todo : [];
  const [localOpen, setLocalOpen] = React.useState(false);
  const open = typeof openProp === "boolean" ? openProp : localOpen;
  const setOpen = setOpenProp ?? setLocalOpen;

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.toggle}
        onClick={() => {
          const next = (prev: boolean) => !prev;
          const setter = setOpen as (
            v: boolean | ((p: boolean) => boolean)
          ) => void;
          setter(next as any);
        }}
        aria-expanded={open}
      >
        {currentStepId !== null && todo[currentStepId - 1] ? (
          <>
            <span className={`${styles.status} ${styles["status-current"]}`} />
            <span className={todo[currentStepId - 1].done ? styles.done : ""}>
              {`${currentStepId} - ${todo[currentStepId - 1].title}`}
            </span>
          </>
        ) : (
          <>Todos ({items.length})</>
        )}
      </button>

      {open && todo && (
        <div className={styles.panel} role="dialog" aria-label="Todo list">
          {items.length === 0 ? (
            <div className={styles.empty}>No todos</div>
          ) : (
            <ul className={styles.list}>
              {items.map((it) => (
                <li key={it.id} className={styles.item}>
                  <label>
                    {/* status dot: current (yellow) or done (green) */}
                    <span
                      className={`${styles.status} ${
                        Number(it.id) === Number(currentStepId)
                          ? styles["status-current"]
                          : it.done
                          ? styles["status-done"]
                          : ""
                      }`}
                    />
                    <span className={it.done ? styles.done : ""}>
                      {it.title}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
