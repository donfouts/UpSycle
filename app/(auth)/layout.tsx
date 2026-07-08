export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="flex min-h-screen items-center justify-center px-6 py-32"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(181,98,42,0.07) 0%, transparent 65%), var(--black)",
      }}
    >
      <div className="w-full max-w-md">{children}</div>
    </section>
  );
}
