export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="embed-layout min-h-screen h-full w-full bg-white text-gray-900 m-0 p-0 font-sans">
      {children}
    </div>
  );
}
