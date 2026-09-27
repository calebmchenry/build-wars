/** A revision signal schedules work; serialization happens only at flush time. */
export function createGuideAutosave(flush: (revision: number) => void, delay = 500) {
  let pending: number | null = null;
  let completed: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const save = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (pending !== null && pending !== completed) {
      const revision = pending;
      flush(revision);
      completed = revision;
      pending = null;
    }
  };
  return {
    schedule(revision: number) {
      if (revision === completed || revision === pending) return;
      pending = revision;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(save, delay);
    },
    flush: save,
    dispose() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    }
  };
}
