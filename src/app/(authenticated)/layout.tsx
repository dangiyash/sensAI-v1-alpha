import AuthenticatedLayout from "@/components/AuthenticatedLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
} 