import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export default async function SuperAdminLogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.findFirst({ where: { OR: [{ id: userId }, { email: user?.email || '' }] } });
  if (dbUser?.role !== "SUPER_ADMIN") {
    return <div className="text-red-400 p-8">Unauthorized access.</div>;
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
    if (actionUser?.role !== "SUPER_ADMIN") return;

    const id = formData.get("id") as string;
    if (id) {
      await prisma.systemLog.update({
        where: { id },
        data: { isResolved: true },
      });
      revalidatePath("/superadmin/logs");
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
    if (actionUser?.role !== "SUPER_ADMIN") return;

    const id = formData.get("id") as string;
    if (id) {
      await prisma.systemLog.delete({ where: { id } });
      revalidatePath("/superadmin/logs");
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-botanical-accent mb-2">System Logs</h1>
        <p className="text-botanical-muted">{logs.length} log entr{logs.length !== 1 ? 'ies' : 'y'} • {logs.filter((l: any) => !l.isResolved).length} unresolved</p>
      </div>
      <div className="bg-botanical-surface rounded-xl border-2 border-b-[6px] border-botanical-border overflow-hidden">
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
                <tr key={log.id} className={log.level === "ERROR" && !log.isResolved ? "bg-red-900/20" : "hover:bg-botanical-surface"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-botanical-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-botanical-text">
                    <span className={`font-semibold ${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'}`}>{log.level}</span>
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
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-400">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/20 text-red-400">
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
                         <button type="submit" className="text-red-400 hover:text-red-300">
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
