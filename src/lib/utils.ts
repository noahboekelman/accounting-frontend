const THREAD_ID_KEY = "thread_id";

export const getThreadIdFromSessionStorage = (): string | null => {
  return sessionStorage.getItem(THREAD_ID_KEY);
};

export const setThreadIdToSessionStorage = (threadId: string) => {
  const currentThreadId = getThreadIdFromSessionStorage();
  if (currentThreadId && currentThreadId === threadId) {
    return; // No need to update
  }
  sessionStorage.setItem(THREAD_ID_KEY, threadId);
};
