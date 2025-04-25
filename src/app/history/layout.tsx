import AuthenticatedLayout from "@/components/AuthenticatedLayout";

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
} 