export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Full-screen layout — no navbar, no max-width container
  return <>{children}</>;
}
