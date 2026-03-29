const fs = require('fs');
const code = `'use client';
import { useState, useEffect } from 'react';
interface ClientDetailProps {
  shopId: string;
  clientId: string;
  clientName: string;
  onClose: () => void;
}
export default function ClientDetailModal({ shopId, clientId, clientName, onClose }: ClientDetailProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // CRM Form fields
  const [formData, setFormData] = useState({
    clientNotes: '',
    preferences: '',
    allergies: '',
    marketingConsent: false,
    smsConsent: false
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);
  useEffect(() => {
    fetch(\`/api/shops/\${shopId}/clients/\${clientId}\`)
      .then(res => res.json())
      .then(data => {
        setClient(data);
        setFormData({
          clientNotes: data.clientNotes || '',
          preferences: data.preferences || '',
          allergies: data.allergies || '',
          marketingConsent: data.marketingConsent || false,
          smsConsent: data.smsConsent || false
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shopId, clientId]);
  const saveCrmData = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(\`/api/shops/\${shopId}/clients/\${clientId}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSavedNotes(true);
        setTimeout(() => setSavedNotes(false), 2000);
      }
    } catch {
      alert('Failed to save profile');
    } finally {
      setSavingNotes(false);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/30">COMPLETED</span>;
      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">NO-SHOW</span>;
      case 'CANCELLED': return <span className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30">CANCELLED</span>;
      default: return <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/30">        body: JSON.strin  };
  const handleChange = (e: any) => {
    const { name, value, type, checked }         setS    setFormData(prev => ({
      ...p           [name]: type === 'checkbox' ? checked : val       }      };
  ret    }     <div className="fixed inset-0      setSavin-[    }
  };
  const getStatuif  };nt  cp-    switch (status) {
      case 'COMPL      <d      case 'COMPLETEte      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">NO-SHOW<        <div      case 'CANCELLED': return <span className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30">CANCELLED</span>;
cl      default: return <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/30">        body: JSON.strin  const handleChange = (e: any) => {
    const { name, value, type, checked }         setS    setFormData(prev => ({
      ...p           [name]: type === 'c             const { name, value, type, chece=      ...p           [name]: type === 'checkbox' ? checked : val       }      en  ret    }     <div className="fixed inset-0      setSavin-[    }
  };
  const <p  };
  const getStatuif  };nt  cp-    switch (status) {
           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/30">        body: JSON.strin  const handleChange = (e: any) => {
    const { name, value, type, checked }         setS    setFormData(prev => ({
      ...p           [name]: type === 'c             const { name, value, type, chece=      .t-    const { name, value, type, checked }         setS    setFormData(prev => ({
      ...p           [name]: type === 'c             const { name, value, type, chece=      ...p           [name]: tme="      ...p           [name]: type === 'c             const { ient.clientAppointm  };
  const <p  };
  const getStatuif  };nt  cp-    switch (status) {
           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <span className="bg-blue-900/50 text                  <p className="tex  c9px] text-gray-40    percase tracking-wider">Spent</p>
                 const { name, value, type, checked }         setS    setFormData(prev => ({
      ...p           [name]: type === 'c             const { name, value, type, chece=      .t-    const { name, value, type, checked }         setS    setFormData(prev => ({
   O_SHOW')      ...p                      </p>
                  <p className="text-[9px]       ...p           [name]: type === 'c             const { name, value, type, chece=      ...p           [name]: tme="      ...p           [name]: type === 'c                 const <p  };
  const getStatuif  };nt  cp-    switch (status) {
           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <span className="bg-blue-900/50 text           cl  const getSte-           ) :       case 'COMPL      <d                            const { name, value, type, checked }         setS    setFormData(prev => ({
      ...p           [name]: type === 'c             const { name, value, type, chece=      .t-    const { name, valume="flex       ...p           [name]: type =                          <div className="min-w-0">
         O_SHOW')      ...p                      </p>
                  <p className="text-[9px]       ...p           [name]: type === 'c             const { name, value, type, -gra                                      {new Date(  const getStatuif  };nt  cp-    switch (status) {
           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <span className="bg-blue-900/50 text           cl  const getSte-           ) :       case              ) :       case 'COMPL      <d      casme      ...p           [name]: type === 'c             const { name, value, type, chece=      .t-    const { name, valume="flex       ...p           [name]: type =                          <div className="min-w-0">
         O_SHOW')      ...p                      </p>
                  <p classNam           O_SHOW')      ...p                      </p>
                  <p className="text-[9px]       ...p           [name]: type === 'c             const { name, value, type, -gra                              r-                  <p className="text-[                           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <span className="bg-blue-900/50 text           cl  const getSte-           ) :       case              ) :       case 'COMPL      <d   f         O_SHOW')      ...p                      </p>
                  <p classNam           O_SHOW')      ...p                      </p>
                  <p className="text-[9px]       ...p           [name]: type === 'c             const { name, value, type, -gra                              r-                  <p className="text-[                           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <s{h                  <p classNam           O_SHOW')    ra                  <p className="text-[9px]       ...p           [name]: type === 'c/1                  <p classNam           O_SHOW')      ...p                      </p>
                  <p className="text-[9px]       ...p           [name]: type === 'c             const { name, value, type, -gra                              r-                  <p className="text-[                           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <s{h                  <p classNam           O_SHOW')    ra                  <p className="text-[9px]                       <p className="text-[9px]       ...p           [name]: type === 'cfe                  <p className="text-[9px]       ...p           [name]: type === 'c             const { name, value, type, -gra                              r-                  <p className="text-[                           ) :       case 'COMPL      <d      case 'COMPLETEte  lscl      default: return <s{h                  <p classNam           O_SHOW')    ra                  <p className="text-[9px]                       <p className="text-[9px]       ...p           [name]: type === 'cfe                  <p className="text       value={formData.allergies}
                      onChange={handleChange}
                      placeholder="e.g. allergic to almond oil products"
                      className="w-full bg-black/40 border border-red-500/30 rounded-md p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="marketingConsent" 
                          checked={formData.marketingConsent} 
                          onChange={handleChange}
                          className="rounded border-white/10 bg-slate-900 text-brand-gold focus:ring-brand-gold"
                        />
                        <span className="text-sm text-gray-300">Accepts Email Marketing</span>
                                    onChange     <label className="flex items-center space-x                      className="w-full bg-black/40                                          />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
                    <label className="flexe}                                         <div bo                    <label className="flex items-center space-x-2                                        <input 
                          type="checkbox" 
      ts                          typ                                                                        check              </div>                          onChange={handleChange}
           -b                          className="ro                                   />
                        <span className="text-sm text-gray-300">Accepts Email Marketal                                                               onChange     <label className="flex ite                  di                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
                    <label className="flexe}                                                                                   <label className="flexe}                                                               type="checkbox" 
      ts                          typ                                                                        check              </div>                                  ts      }
`;
fs.writeFileSync('compon           -b                          className="ro                                   />
     cat << 'EOF' > create_client_modal.js
const fs = require('fs');
const content = `'use client';
import { useState, useEffect } from 'react';
interface ClientDetailProps {
  shopId: string;
  clientId: string;
  clientName: string;
  onClose: () => void;
}
export default function ClientDetailModal({ shopId, clientId, clientName, onClose }: ClientDetailProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // CRM Form fields
  const [formData, setFormData] = useState({
    clientNotes: '',
    preferences: '',
    allergies: '',
    marketingConsent: false,
    smsConsent: false
  });
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);
  useEffect(() => {
    fetch(\`/api/shops/\${shopId}/clients/\${clientId}\`)
      .then(res => res.json())
      .then(data => {
        setClient(data);
        setFormData({
          clientNotes: data.clientNotes || '',
          preferences: data.preferences || '',
          allergies: data.allergies || '',
          marketingConsent: data.marketingConsent || false,
          smsConsent: data.smsConsent || false
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shopId, clientId]);
  const saveCrmData = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(\`/api/shops/\${shopId}/clients/\${clientId}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSavedNotes(true);
        setTimeout(() => setSavedNotes(false), 2000);
      }
    } catch {
      alert('Failed to save profile');
    } finally {
      setSavingNotes(false);
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/30">COMPLETED</span>;
      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold borde        });
        setLoading(false);
      ca        seLE      })
      .catch(() e=      .-9  }, [shopId, clientId]);
  const saed   const saveCrmData = asrd    setSavingNotes(true);
    try pa          default: return       coas        method: 'PATCH',
        headers: { 'Content-Type': 'application/jsld bo        headers: { 'Con">        body: JSON    }
  };
  const handleChange = (e: a      });    const { name, value, type,       if}         setS    setF        setTimeout(      ...p      }
    } catch {
      alert('Failed to save pral       }      };
  return (
    <div className="fixed inset-0 bg-black/80 z-[    }
  };
  const getStatuif  };nt  cp-    switch (status) {
      case 'COMPL      <d      case 'COMPLETEte      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold borde        });
        setLoading(        <div        setLoading(false);
      ca        seLE      })
      .catch(() e=      .-9  }, [shopId, clientId]);
  const saed   const saveon      ca        seLE     cl      .catch(()            {c  const saed   const saveCrmData = asrd    setSavinxt    try pa          default: return       coas        method: 'ar        headers: { 'Content-Type': 'application/jsld bo                  };
  const handleChange = (e: a      });    const { name, value, type,       if}           </div>
             } catch {
      alert('Failed to save pral       }      };
  return (
    <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <        {loading ? (
          <p className=  };
  const getStatuif  };nt  cp-    switch (st         c:       case 'COMPL      <d      case 'COMPLETEte  ls        setLoading(        <div        setLoading(false);
      ca        seLE      })
      .catch(() e=      .-9  }, [shopId, clientId]);
  const saed   const saveon      ca      lg      ca        seLE      })
      .c                  <p       .catch(() e=      .-9d   const saed   const saveon      ca        seLE    }<  const handleChange = (e: a      });    const { name, value, type,       if}           </div>
             } catch {
      alert('Failed to save pral       }      };
  return (
    <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {
      alert('Failed to save pral       }      };
  return (
    <div cCO      alert('Failed t:   return (
    <div className="fixed inset-0  a.t    <div t   };er      alert(n>  return (
    <        {loadi         <        {load                       <p className= [9  const getStatuif  };nt  e       ca        seLE      })
      .catch(() e=      .-9  }, [shopId, clientId]);
  const saed   const saveon      ca      lg      ca        seLE      })
      .c        .catch(() e=      .-9t-  const saed   const saveon      ca      lg      cali      .c                  <p       .catch(() e=      .-9d   const saed0}             } catch {
      alert('Failed to save pral       }      };
  return (
    <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x       alert('Failed t-[  return (
    <div className="fixed inset-0 bg f    <div ol  };er      alert(n>  return (
    <      gr         </    <      gr                        alert('Failed to save pral  ng  return (
    <div cCO      alert('Failed t:  ac    <div rf    <div className="fixed inset-0                 <        {loadi         <        {load                       <p className=<d      .catch(() e=      .-9  }, [shopId, clientId]);
  const saed   const saveon      ca      lg      ca        seLE      })
      .c   us  const saed   const saveon      ca      lg      ca        .c        .catch(() e=      .-9t-  const saed   const saveon    e=      alert('Failed to save pral       }      };
  return (
    <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div className="fixed inset-0 bg m    <div or  };er      alert(n>  return (
    <                       <      gr             } cme    <div className="fixed inset-0 bg f    <div ol  };er      alert         <      gr         </    <      gr                        alert('Failed to ht    <div cCO      alert('Failed t:  ac    <div rf    <div className="fixed inset-0                 <ou  const saed   const saveon      ca      lg      ca        seLE      })
      .c   us  const saed   const saveon      ca      lg      ca        .c        .catch(() e=      .-9t-  const saed   const saveon    e=      alert('Fai        .c   us  const saed   const saveon      ca      lg      c           return (
    <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div className="fixed                 <di      };er      alert(n>  return (
    <      gr          r    <      gr             } c/5    <div className="fixed inset-0 bg m    <div or v>    <                       <      gr             } cme    <div className="fixnt      .c   us  const saed   const saveon      ca      lg      ca        .c        .catch(() e=      .-9t-  const saed   const saveon    e=      alert('Fai        .c   us  const saed   const saveon      ca      lg      c           return (
    <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x   te  return          <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div className="fixed                 <di      };er      alert(n>  return (
    <      gr      no  };er      alert(n>  return (
    <                       <      gr                      <div className="fixed                       <div    <      gr          r    <      gr             } c/5    <div className="fixpp    <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x   te  return          <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div className="fixed                 <di      };er      alert(n>  return (
    <      gr      no  };er      alert(n>  return (
    <        t-  };er      alert(n>  return (
    <      gr         or    <      gr                    };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div className="fixed1p    <      gr             } cca    <div className="fixed                 <di           <      gr      no  };er      alert(n>  return (
    <                      n    <                       <      gr             at  };er      alert(n>  return (
    <      gr             } catch {x   te  return          <div className="fixed inset-0 bg-black/80 z-[    }
  };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div classNate    <      gr             } cut  };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div className="fixedNa    <      gr             } bor    <div className="fixed                 <di     ss    <      gr      no  };er      alert(n>  return (
    <        t-  };er    npu    <        t-  };er      alert(n>  return (
          <      gr         or    <      gr       
     <      gr             } catch {x   te  return (
    <div className="fixed1p    <      <div className="fixed1p    <      gr                <                      n    <                       <      gr             at  };er      alert(n>  return (
    <      gr             } catch {x   te  returnsm    <      gr             } catch {x   te  return          <div className="fixed inset-0 bg-black/80 z-[    }am  };er      alert(n>  return (
    <      gr             } catch {x   te  return (
    <div classNate    <  pe    <      gr                      <div classNate    <      gr             } cut       <      gr             } catch {x   te  return (
    <div className="fixedNge    <div className="fixedNa    <      gr          de    <        t-  };er    npu    <        t-  };er      alert(n>  return (
          <      gr         or    <      gr       
     <      gr             } catch s           <      gr         or    <      gr       
     <                      <      gr             } catch {x   te  returv>    <div className="fixed1p    <      <div classNamer    <      gr             } catch {x   te  returnsm    <      gr             } catch {x   te  return          <div className="fixed inset-0 bg-black/80 z-[    }am  };er      alert(n>  retu             <      gr             } catch {x   te  return (
    <div classNate    <  pe    <      gr                      <div classNate    <      gr             } cut       <      gr             } cnd    <div classNate    <  pe    <      gr          ed    <div className="fixedNge    <div className="fixedNa    <      gr          de    <        t-  };er    npu    <        t-  };er      alert(n>  return (
      to          <      gr         or    <      gr       
     <      gr             } catch s           <      gr         or    <      gr       
     <       et     <      gr             </div>
    </div>
  );
}
`;
fs.writeFileSync('components/ClientDetailModal.tsx', content);
console.log('ClientDe    <div classNate    <  pe    <      gr                      <div classNate    <  EOF
EOF
rm create_client_modal.js
EOF
`
'
"
]
}
)
EOF
^C
