import { OperatorShell } from "@/components/operator-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OperatorShell>{children}</OperatorShell>;
}
