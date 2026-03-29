import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export default async function SuperAdminLogsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role !== "SUPER_ADMIN") {
    return <div>Unauthorized access.</div>;
  }

  const logs = await prisma.systemLog.findMany({
    orderBy: { createdAt: "desc" },
  });

  async function resolveLog(formData: FormData) {
    "use server";
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
    const id = formData.get("id") as string;
    if (id) {
      await prisma.systemLog.delete({ where: { id } });
      revalidatePath("/superadmin/logs");
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-black">System Logs</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-black">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level & Path</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className={log.level === "ERROR" && !log.isResolved ? "bg-red-50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <span className="font-semibold">{log.level}</span>
                    <br />
                    <span className="text-gray-500 text-xs">{log.path || "N/A"}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 break-words max-w-md">
                    <div className="font-medium">{log.message}</div>
                    {log.stack && (
                      <details className="mt-1">
                        <summary className="text-xs text-blue-500 cursor-pointer">View Stack</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto text-black">
                          {log.stack}
                        </pre>
                      </details>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.isResolved ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Resolved
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Open
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                       {!log.isResolved && (
                         <form action={resolveLog}>
                           <input type="hidden" name="id" value={log.id} />
                           <button type="submit" className="text-indigo-600 hover:text-indigo-900">
                             Resolve
                           </button>
                         </form>
                       )}
                       <form action={deleteLog}>
                         <input type="hidden" name="id" value={log.id} />
                         <button type="submit" className="text-red-600 hover:text-red-900">
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
