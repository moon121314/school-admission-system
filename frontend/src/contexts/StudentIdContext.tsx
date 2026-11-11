import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "studentId";

interface StudentIdApi {
  studentId: string | null;
  setStudentId: (value: string) => void;
  clearStudentId: () => void;
}

const StudentIdContext = createContext<StudentIdApi | null>(null);

export function StudentIdProvider({ children }: { children: ReactNode }) {
  const [studentId, setState] = useState<string | null>(null);

  useEffect(() => {
    setState(localStorage.getItem(STORAGE_KEY));
  }, []);

  function setStudentId(value: string) {
    const trimmed = value.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      setState(trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setState(null);
    }
  }

  function clearStudentId() {
    localStorage.removeItem(STORAGE_KEY);
    setState(null);
  }

  return (
    <StudentIdContext.Provider
      value={{ studentId, setStudentId, clearStudentId }}
    >
      {children}
    </StudentIdContext.Provider>
  );
}

export function useStudentId() {
  const ctx = useContext(StudentIdContext);
  if (!ctx)
    throw new Error("useStudentId must be used inside <StudentIdProvider>");
  return ctx;
}
