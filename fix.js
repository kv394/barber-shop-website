const fs = require('fs');
const content = `import prisma from "@/lib/prisma";
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
  async function resolveLog(formData) {
    "use server";
    const id = formData.get("id");
    if (id) {
      await prisma.systemLog.update({
        where: { id },
        data: { isResolved: true },
      });
      revalidatePath("/superadmin/logs");
    }
  }
  async function deleteLog(formData) {
    "use server";
    const id = formData.get("id");
    if (const fs = require('isconst content = `import erimport { revalidatePath } from "next/cache";
imporgsimport { redir  return (
    <div className="import { auth } from "@clerk/nextjs/servere=export const dynamic = 'force-dynamic';
exp Lexport default async function SuperAdme   const { userId } = await auth();
  if (!userId) {cl  if (!userId) {
    redirect("/sde    rediretext-bl  }
  const user = awaitla  Na  if (user?.role !== "SUPER_ADMIN") {
    return <div>Unauthorized acc-3    return <div>Unauthorized access.gr  }
  const logs = await prisma.systemLog.<t  cl    orderBy: { createdAt: "desc" },
  });
  asym   });
  async function resolveLog(at  ash>    "use server";
    const id = formD3     const id = fs     if (id) {
      await prisma.se      await h>        where: { id },
        data:y-        data: { isReson      });
      revalidatePath("/sSt      re>
    }
  }
  async function deleteLog(forex  }
gh  te    "use server";
    const id = formca    const id = f
     if (const fs = require('iscond>imporgsimport { redir  return (
    <div className="import { auth } from "@clerk/nextjs/servere=exp
     <div className="import { a  exp Lexport default async function SuperAdme   const { userId } = await auth();
  if (!userId) {cl  ifou  if (!userId) {cl  if (!userId) {
    redirect("/sde    rediretext-bl  }
  colo    redirect("/sde                <  const user = awaitla  Na  if (user?==    return <div>Unauthorized acc-3    return <div>Unauthorized    const logs = await prisma.systemLog.<t  cl    orderBy: { createdAt: "des    });
  asym   });
  async function resolveLog(at  ash>    "use server";
    ctd  as    async fun      const id = formD3     const id = fs     if (id)         await prisma.se      await h>        where: { .l        data:y-        data: { isReson      });
      re        revalidatePath("/sSt      re>
    }
  }
.p    }
  }
  async function deleteL    }
d>    gh  te    "use server";
    const  p    const id = formca 90     if (const fs = require('iscond>      <div className="import { auth } from "@clerk/nextjs/servere=ex       <div className="import { a  exp Lexport default async functiomt  if (!userId) {cl  ifou  if (!userId) {cl  if (!userId) {
    redirect("/sde    rediretext-bl  }
  colo    red      redirect("/sde    rediretext-bl  }
  colo    redirect00  colo    redirect("/sde             ck  asym   });
  async function resolveLog(at  ash>    "use server";
    ctd  as    async fun      const id = formD3     const id = fs     if (id)         await prisma.se      await h>        where: { .l        data:y-        t-gray-500">
      ctd  as    async fun      const id = form               re        revalidatePath("/sSt      re>
    }
  }
.p    }
  }
  async function deleteL    }
d>    gh  te    "use server";
    const  p    const id = formca 90     if (const f      }
  }
.p    }
  }
  async function  classN  }
"p.p2   }
  -f  x d>    gh  te    "use server"d-    const  p    const id = f">    redirect("/sde    rediretext-bl  }
  colo    red      redirect("/sde    rediretext-bl  }
  colo    redirect00  colo    redirect("/sde             ck  asym   });
  async function resolveLog(at  ash>    "use server";
    ctd  as    async fun      const id = formD3     colo    red      redirect("/sde    &&  colo    redirect00  colo    redirect("/sde        }>  async function resolveLog(at  ash>    "use server";
    ctd  a={log.id    ctd  as    async fun      const id = formD3     "       ctd  as    async fun      const id = form               re        revalidatePath("/sSt      re>
    }
  }
.p    }
  }
  async function deleteL    }
d>    gh            }
  }
.p    }
  }
  async function deleteL    }
d>    gh  te    "use server";
    const  p    co"h  }
n".pam  }
   v  ued>    gh  te    "use server"      const  p    const id = f"   }
.p    }
  }
  async function  classN  }
"p.p2   }
  -f  .p    }
      le"p.p2   }
  -f  x d>    gh    -f  x >
  colo    red      redirect("/sde    rediretext-bl  }
  colo    redirect00  </td>
                </tr>
     colo    redirect00  colo    redirect("/sde            async function resolveLog(at  ash>    "use server";
    ctd  as    ape    ctd  as    async fun      const id = formD3  rm fi    cset +H
echo 'aW1wb3J0IHByaXNtYSBmcm9tICJAL2xpYi9wcmlzbWEiOwppbXBvcnQgeyByZXZhbGlkYXRlUGF0aCB9IGZyb20gIm5leHQvY2FjaGUiOwppbXBvcnQgeyByZWRpcmVjdCB9IGZyb20gIm5leHQvbmF2aWdhdGlvbiI7CmltcG9ydCB7IGF1dGggfSBmcm9tICJAY2xlcmsvbmV4dGpzL3NlcnZlciI7CgpleHBvcnQgY29uc3QgZHluYW1pYyA9ICdmb3JjZS1keW5hbWljJzsKCmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIFN1cGVyQWRtaW5Mb2dzUGFnZSgpIHsKICBjb25zdCB7IHVzZXJJZCB9ID0gYXdhaXQgYXV0aCgpOwogIGlmICghdXNlcklkKSB7CiAgICByZWRpcmVjdCgiL3NpZ24taW4iKTsKICB9CgogIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHsgd2hlcmU6IHsgaWQ6IHVzZXJJZCB9IH0pOwogIGlmICh1c2VyPy5yb2xlICE9PSAiU1VQRVJfQURNSU4iKSB7CiAgICByZXR1cm4gPGRpdj5VbmF1dGhvcml6ZWQgYWNjZXNzLjwvZGl2PjsKICB9CgogIGNvbnN0IGxvZ3MgPSBhd2FpdCBwcmlzbWEuc3lzdGVtTG9nLmZpbmRNYW55KHsKICAgIG9yZGVyQnk6IHsgY3JlYXRlZEF0OiAiZGVzYyIgfSwKICB9KTsKCiAgYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUxvZyhmb3JtRGF0YTogRm9ybURhdGEpIHsKICAgICJ1c2Ugc2VydmVyIjsKICAgIGNvbnN0IGlkID0gZm9ybURhdGEuZ2V0KCJpZCIpIGFzIHN0cmluZzsKICAgIGlmIChpZCkgewogICAgICBhd2FpdCBwcmlzbWEuc3lzdGVtTG9nLnVwZGFecho CiAgICAgICAgd2hlcmU6IHsgaWQgfSwKICAgICAgICBkYXRhOiB7IGlzUmVzb2x2ZWQ6IHRydWUyIH0sCiAgICAgIH0pOwogICAgICByZXZhbGlkYXRlUGF0aCgiL3N1cGVyYWRtaW4vbG9ncyIpOwogICAgfQogIH0KCiAgYXN5bmMgZnVuY3Rpb24gZGVsZXRlTG9nKGZvcm1EYXRhOiBGb3JtRGF0YSkgewogICAgInVzZSBzZXJ2ZXIiOwogICAgY29uc3QgaWQgPSBmb3JtRGF0YS5nZXQoImlkIikgYXMgc3RyaW5nOwogICAgaWYgKGlkKSB7CiAgICAgIGF3YWl0IHByaXNtYS5zeXN0ZW1Mb2cuZGVsZXRlKHsgd2hlcmU6IHsgaWQgfSB9KTsKICAgICAgcmV2YWxpZGF0ZVBhdGgoIi9zdXBlcmFkbWluL2xvZ3MiKTsKICAgIH0KICB9CgogIHJldHVybiAoCiAgICA8ZGl2IGNsYXNzTmFtZT0icC04IG1heC13LTd4bCBteC1hdXRvIj4KICAgICAgPGgxIGNsYXNzTmFtZT0idGV4dC0zeGwgZm9udC1ib2xkIG1iLTggdGV4dC1ibGFjayI+U3lzdGVtIExvZ3M8L2gxPgogICAgICA8ZGl2IGNsYXNzTmFtZT0iYmctd2hpdGUgcm91bmRlZC1sZyBzaGFkb3cgb3ZlcmZsb3ctaGlkZGVuIj4KICAgICAgICA8dGFibGUgY2xhc3NOYW1lPSJtaW4tdy1mdWxsIGRpdmlkZS15IGRpdmlkZS1ncmF5LTIwMCB0ZXh0LWJsYWNrIj4KICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9ImJnLWdyYXktNTAiPgogICAgICAgICAgICA8dHI+CiAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0icHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIj5UaW1lPC90aD4KICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPSJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIiPkxldmVsICYgUGF0aDwvdGg+CiAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0icHgtNiBweS0zIHRleHQtbGVmdCB0ZXh0LXhzIGZvbnQtbWVkaXVtIHRleHQtZ3JheS01MDAgdXBwZXJjYXNlIHRyYWNraW5nLXdpZGVyIj5NZXNzYWdlPC90aD4KICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPSJweC02IHB5LTMgdGV4dC1sZWZ0IHRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTUwMCB1cHBlcmNhc2UgdHJhY2tpbmctd2lkZXIiPlN0YXR1czwvdGg+CiAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT0icHgtNiBweS0zIHRleHQtcmlnaHQgdGV4dC14cyBmb250LW1lZGl1bSB0ZXh0LWdyYXktNTAwIHVwcGVyY2FzZSB0cmFja2luZy13aWRlciI+QWN0aW9uczwvdGg+CiAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICA8L3RoZWFkPgogICAgICAgICAgPHRib2R5IGNsYXNzTmFtZT0iYmctd2hpdGUgZGl2aWRlLXkgZGl2aWRlLWdyYXktMjAwIj4KICAgICAgICAgICAge2xvZ3MubGVuZ3RoID09PSAwID8gKAogICAgICAgICAgICAgIDx0cj4KICAgICAgICAgICAgICAgIDx0ZCBjb2xTcGFuPez19IGNsYXNzTmFtZT0icHgtNiBweS00IHRleHQtY2VudGVyIHRleHQtc20gdGV4dC1ncmF5LTUwMCI+CiAgICAgICAgICAgICAgICAgIE5vIGxvZ3MgZm91bmQuCiAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgIDwvdHI+CiAgICAgICAgICAgICkgOiAoCiAgICAgICAgICAgICAgbG9ncy5tYXAoKGxvZykgPT4gKAogICAgICAgICAgICAgICAgPHRyIGtleT17bG9nLmlkfSBjbGFzc05hbWU9e2xvZy5sZXZlbCA9PT0gIkVSUk9SIiAmJiAhbG9nLmlzUmVzb2x2ZWQgPyAiYmctcmVkLTUwIiA6ICIifT4KICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0icHgtNiBweS00IHdoaXRlc3BhY2Utbm93cmFwIHRleHQtc20gdGV4dC1ncmF5LTUwMCI+CiAgICAgICAgICAgICAgICAgICAge25ldyBEYXRlKGxvZy5jcmVhdGVkQXQpLnRvTG9jYWxlU3RyaW5nKCkpfQogICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPSJweC02IHB5LTQgdGV4dC1zbSB0ZXh0LWdyYXktOTAwIj4KICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9ImZvbnQtc2VtaWJvbGQiPns=sb2cubGV2ZWx9PC9zcGFuPgogICAgICAgICAgICAgICAgICAgIDxiciAvPgogICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPSJ0ZXh0LWdyYXktNTAwIHRleHQteHMiPns=sb2cucGF0aCB8fCAiTi9BIn08L3NwYW4+CiAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9InB4LTYgcHktNCB0ZXh0LXNtIHRleHQtZ3JheS05MDAgYnJlYWstd29yZHMgbWF4LXctbWQiPgogICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPSJmb250LW1lZGl1bSI+ez1sb2cubWVzc2FnZX08L2Rpdj4KICAgICAgICAgICAgICAgICAgICB7bG9nLnN0YWNrICYmICgKICAgICAgICAgICAgICAgICAgICAgIDxkZXRhaWxzIGNsYXNzTmFtZT0ibXQtMSI+CiAgICAgICAgICAgICAgICAgICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT0idGV4dC14cyB0ZXh0LWJsdWUtNTAwIGN1cnNvci1wb2ludGVyIj5WaWV3IFN0YWNrPC9zdW1tYXJ5PgogICAgICAgICAgICAgICAgICAgICAgICA8cHJlIGNsYXNzTmFtZT0ibXQtMiB0ZXh0LXhzIGJnLWdyYXktMTAwIHAtMiByb3VuZGVkIG92ZXJmbG93LXgtYXV0byB0ZXh0LWJsYWNrIj4KICAgICAgICAgICAgICAgICAgICAgICAgICB7sb2cuc3RhY2t9CiAgICAgICAgICAgICAgICAgICAgICAgIDwvcHJlPgogICAgICAgICAgICAgICAgICAgICAgPC9kZXRhaWxzPgogICAgICAgICAgICAgICAgICAgICl9CiAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9InB4LTYgcHktNCB3aGl0ZXNwYWNlLW5vd3JhcCB0ZXh0LXNtIHRleHQtZ3JheS01MDAiPgogICAgICAgICAgICAgICAgICAgIHtsb2cuaXNSZXNvbHZlZCA/ICgKICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT0icHgtMiBpbmxpbmUtZmxleCB0ZXh0LXhzIGxlYWRpbmctNSBmb250LXNlbWlib2xkIHJvdW5kZWQtZnVsbCBiZy1ncmVlbi0xMDAgdGV4dC1ncmVlbi04MDAiPgogICAgICAgICAgICAgICAgICAgICAgICBSZXNvbHZlZAogICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPgogICAgICAgICAgICAgICAgICAgICkgOiAoCiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9InB4LTIgaW5saW5lLWZsZXggdGV4dC14cyBsZWFkaW5nLTUgZm9udC1zZW1pYm9sZCByb3VuZGVkLWZ1bGwgYmctcmVkLTEwMCB0ZXh0LXJlZC04MDAiPgogICAgICAgICAgICAgICAgICAgICAgICBPcGVuCiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+CiAgICAgICAgICAgICAgICAgICAgKX0KICAgICAgICAgICAgICAgICAgPC90ZD4KICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT0icHgtNiBweS00IHdoaXRlc3BhY2Utbm93cmFwIHRleHQtcmlnaHQgdGV4dC1zbSBmb250LW1lZGl1bSI+CiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9ImZsZXgganVzdGlmeS1lbmQgc3BhY2UteC0yIj4KICAgICAgICAgICAgICAgICAgICAgICAgeyFsb2cuaXNSZXNvbHZlZCAmJiAoCiAgICAgICAgICAgICAgICAgICAgICAgICA8Zm9ybSBhY3Rpb249ez1cmVzb2x2ZUxvZ30+CiAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSJoaWRkZW4iIG5hbWU9ImlkIiB2YWx1ZT17sb2cuaWR9IC8+CiAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT0ic3VibWl0IiBjbGFzc05hbWU9InRleHQtaW5kaWdvLTYwMCBob3Zlcjp0ZXh0LWluZGlnby05MDAiPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlc29sdmUKICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+CiAgICAgICAgICAgICAgICAgICAgICAgICA8L2Zvcm0+CiAgICAgICAgICAgICAgICAgICAgICAgKX0KICAgICAgICAgICAgICAgICAgICAgICA8Zm9ybSBhY3Rpb249ez1kZWxldGVMb2d9PgogICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IHR5cGU9ImhpZGRlbiIgbmFtZT0iaWQiIHZhbHVlPXtsb2cuaWR9IC8+CiAgICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9InN1Ym1pdCIgY2xhc3NOYW1lPSJ0ZXh0LXJlZC02MDAgaG92ZXI6dGV4dC1yZWQtOTAwIj4KICAgICAgICAgICAgICAgICAgICAgICAgICAgRGVsZXRlCiAgICAgICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj4KICAgICAgICAgICAgICAgICAgICAgICA8L2Zvcm0+CiAgICAgICAgICAgICAgICAgICAgPC9kaXY+CiAgICAgICAgICAgICAgICAgIDwvdGQ+CiAgICAgICAgICAgICAgICA8L3RyPgogICAgICAgICAgICAgICkpCiAgICAgICAgICAgICl9CiAgICAgICAgICA8L3Rib2R5PgogICAgICAgIDwvdGFibGU+CiAgICAgIDwvZGl2PgogICAgPC9kaXY+CiAgKTsKfQo=' | base64 --decode > app/superadmin/logs/page.tsx
