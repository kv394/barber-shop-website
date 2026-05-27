export default function EmbedLayout({ children }: { children: React.ReactNode }) {
 return (
 <div className="embed-layout min-h-screen h-full w-full bg-crm-surface text-crm-text m-0 p-0 ">
 {children}
 </div>
 );
}
