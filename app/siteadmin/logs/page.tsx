import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SiteAdminLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: user?.email || '' }] } });
  if (dbUser?.role !== "SITE_ADMIN") {
    return <div className="text-status-cancelled p-8">Unauthorized access.</div>;
  }

  const logs = await prisma.systemLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  async function resolveLog(formData: FormData) {
    "use server";
    // SECURITY: Re-verify auth — server actions can be called directly
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    const actionUserId = user?.id;
    if (!actionUserId) return;
    const actionUser = await prisma.user.findFirst({ where: { OR: [{ id: actionUserId }, { email: user?.email || '' }] } });
    if (actionUser?.role !== "SITE_ADMIN") return;

    const id = formData.get("id") as string;
    if (id) {
      await prisma.systemLog.update({
        where: { id },
        data: { isResolved: true },
      });
      revalidatePath("/siteadmin/logs");
    }
  }

  async function deleteLog(formData: FormData) {
    "use server";
    // SECURITY: Re-verify auth — server actions can be called directly
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    const actionUserId = user?.id;
    if (!actionUserId) return;
    const actionUser = await prisma.user.findFirst({ where: { OR: [{ id: actionUserId }, { email: user?.email || '' }] } });
    if (actionUser?.role !== "SITE_ADMIN") return;

    const id = formData.get("id") as string;
    if (id) {
      await prisma.systemLog.delete({ where: { id } });
      revalidatePath("/siteadmin/logs");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif font-bold text-botanical-accent mb-2 text-4xl md:text-5xl lg:text-6xl">System Logs</h1>
        <p className="text-botanical-muted text-base md:text-lg">{logs.length} log entr{logs.length !== 1 ? 'ies' : 'y'} • {logs.filter((l: any) => !l.isResolved).length} unresolved</p>
      </div>
      <div className="bg-botanical-surface rounded-xl border border-botanical-border shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-white/10 text-botanical-text">
          <thead className="bg-botanical-surface">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-botanical-muted uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-botanical-muted uppercase tracking-wider">Level & Path</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-botanical-muted uppercase tracking-wider">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-botanical-muted uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-botanical-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-botanical-muted">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className={log.level === "ERROR" && !log.isResolved ? "bg-status-cancelled/20" : "hover:bg-botanical-surface"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-botanical-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-botanical-text">
                    <span className={`font-semibold ${log.level === 'ERROR' ? 'text-status-cancelled' : log.level === 'WARN' ? 'text-status-pending' : 'text-status-info'}`}>{log.level}</span>
                    <br />
                    <span className="text-botanical-muted text-xs">{log.path || "N/A"}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-botanical-muted break-words max-w-md">
                    <div className="font-medium">{log.message}</div>
                    {log.stack && (
                      <details className="mt-1">
                        <summary className="text-xs text-botanical-accent cursor-pointer">View Stack</summary>
                        <pre className="mt-2 text-xs bg-botanical-surface p-2 rounded overflow-x-auto text-botanical-muted">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {log.isResolved ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-status-confirmed/20 text-status-confirmed">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-status-cancelled/20 text-status-cancelled">
                        Open
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                       {!log.isResolved && (
                         <form action={resolveLog}>
                           <input type="hidden" name="id" value={log.id} />
                           <button type="submit" className="text-botanical-accent hover:text-botanical-text">
                             Resolve
                           </button>
                         </form>
                       )}
                       <form action={deleteLog}>
                         <input type="hidden" name="id" value={log.id} />
                         <button type="submit" className="text-status-cancelled hover:text-status-cancelled">
                           Delete
                         </button>
                       </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
