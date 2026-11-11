import { useEffect, useState } from "react";

const STORAGE_KEY = "studentId";

export function useStudentId() {
  const [studentId, setStudentIdState] = useState<string | null>(null);

  useEffect(() => {
    setStudentIdState(localStorage.getItem(STORAGE_KEY));
  }, []);

  function setStudentId(value: string) {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setStudentIdState(trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setStudentIdState(null);
    }
  }

  function clearStudentId() {
    localStorage.removeItem(STORAGE_KEY);
    setStudentIdState(null);
  }

  return { studentId, setStudentId, clearStudentId };
}
