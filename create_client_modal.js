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
      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">NO-SHOW</span>;
      case 'CANCELLED': return <span className="bg-red-9  }, [shopId, clientId]);
  const savd   const saveCrmData = asrd    setSavingNotes(true);
    try pa          default: return       coas        method: 'PATCH',
        headers: { 'Content-Type': 'application/json'bo        headers: { 'Con">        body: JSON.strin  };
  const handleChange = (e: a      });    const { name, value, type,       if}         setS    setF        setTimeout(() => se.p           [name]: type === 'checkbox' ? checked : value
    }));
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justif  };nt  cp-    switch (status) {
      case 'COMPL      <d      case 'COMPLETEte      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">NO-SHOW<        <div      case 'CANCELLED': return <span className="bg-red-9  }, [shopId, clientId]);
  const savd   const saveCrmData = asrd    setSavingNotes(true);
    try pa    cl  const savd   const saveCrmData = asrd    setSavingNotes(true);
    try pa     xt    try pa          default: return       coas        method: 'ar        headers: { 'Content-Type': 'application/json'bo                  const handleChange = (e: a      });    const { name, value, type,             )}
          </div>
             }));
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justif  };nt  cp-    switch (status) {
      case 'CO        </div>
        {loading ? (
          <p    <div e=      case 'COMPL      <d      case 'COMPLETEte         ) : client ? (
          <div className="grid grid-cols  const savd   const saveCrmData = asrd    setSavingNotes(true);
    try pa    cl  const savd   const saveCrmData = asrd    setSavingNotes(true);
    try pa     xt    try pa          default: return       coas        method: 'ar        headers: { 'Content-Type': 'application/json'bo           ol    try pa    cl  const savd   const saveCrmData = asrd              try pa     xt    try pa          default: return       coas        method: si          </div>
             }));
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justif  };nt  cp-    switch (status) {
      case 'CO        </div>
        {loading ? (
          <p    <div epp             })er  };
  return (
ta  r =    <div ET      case 'CO        </div>
        {loading ? (
          <p    <div e=      case 'COMPL      <d      c              {loading ? (
      ex          <p    <di00          <div className="grid grid-cols  const savd   const saveCrmData = asrd    setSavingbg    try pa    cl  const savd   const saveCrmData = asrd    setSavingNotes(true);
    try pa     xt    tl     try pa     xt    try pa          default: return       coas        method: er             }));
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justif  };nt  cp-    switch (status) {
      case 'CO        </div>
        {loading ? (
          <p    <div epp             })er  };
  return (
ta  r =    <div ET      case 'CO        </div>
        {loal   };
  return (
    r      <div <h      case 'CO        </div>
        {loading ? (
          <p    <div epp             })er  };
  return (
            {loading ? (
      pp          <p    <di 0  return (
ta  r =    <div ET      case 'CO -yta  r =  ow        {loading ? (
          <                         <p    <diAp      ex          <p    <di00          <div className="grid grid-cols  const sav="    try pa     xt    tl     try pa     xt    try pa          default: return       coas        method: er             }));
  };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] fl           };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justif  };nt  cp-    switch (sp cla  ram    <div 10      case 'CO        </div>
        {loading ? (
          <p    <div epp             })er  };
  return (
tant        {loading ? (
       y          <p    <di    return (
ta  r =    <div ET      case 'CO  &ta  r =  \$        {loal   };
                              retu                 r              {                          <div classNa          <p    <dink  return (
            {loading ? (
      ppss         t-      pp          <p   {ata  r =    <div ET      case 'CO                  <                         <p    <diAp                      };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] fl           };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justif  };nt  cp-    switch (sp cla  ram    <div 10      case 'CO        </div>
 er  rit    <div de  return (
    <div className="fixed inset-0 bg-black/80 z-[100           <div v>        {loading ? (
          <p    <div epp             })er  };
  return (
tant        {loading ? (
       y          <p    <di    return (
ta  r = c          <p    <dion  return (
tant        {loading ? (
       y2"tant     ??       y          <p   h4ta              <div>
                <l                              retu                 r           tr            {loading ? (
      ppss         t-      pp          <p   {ata  r =    <div ET      case 'CO                  <             rm      ppss                 return (
    <div className="fixed inset-0 bg-black/80 z-[100] fl           };
  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex itemsou    <div -2  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flerd    <div go er  rit    <div de  return (
    <div className="fixed inset-0 bg-black/80 z-[100           <div v>        {loading ? (
          <p    <div epp     ]     <div className="fixedase t          <p    <div epp             })er  };
  return (
tant        {loading ? (
           return (
tant        {loading ?             tant     ue       y          <p   
 ta  r = c          <p    <dion  returne}t                  placeholder="e.g. prefers silent appointments,                               className="w-full bg-black/40 border b      ppss         t-      pp          <p   {ata  r =    <div ET      case 'CO                  <         d-    <div className="fixed inset-0 bg-black/80 z-[100] fl                          <label className="block text-[11px] text-red-400/80 mb-1 uppercase  return (
    <div className="fixed inset-0 b                <input
                <div className="fixed inset-0 bg-black/80 z-[100] flerd    <div go er  rit    <div.a    <div className="fixed inset-0 bg-black/80 z-[100           <div v>        {loading ? (
       o           <p    <div epp     ]     <div className="fixedase t          <p    <div epp    0/  return (
tant        {loading ? (
           return (
tant        {loading ?             tant            tant     >
              </div>
    tant        {loadiss ta  r = c          <p    <dion  returne}t                  placeholbe    <div className="fixed inset-0 b                <input
                <div className="fixed inset-0 bg-black/80 z-[100] flerd    <div go er  rit    <div.a    <div className="fixed inset-0 bg-black/80 z-[100           <div v>        {loading ? (
       o           <p    <div epp     ]     <div className="fixedase t          <p    <div epp    0/  return (
tant        {loading ? (
           return (
tant        {loading ?             ex                <div className="fixed inset                      o           <p    <div epp     ]     <div className="fixedase t          <p    <div epp    0/  return (
tant        {loading ? (
           return (
tant        {loading ?             tant        {loading ? (
           return (
tant        {loading ?             tant            tant     >
               return (
tanortant        {loadiat              </div>
    tant        {loadiss                     ta                               <div className="fixed inset-0 bg-black/80 z-[100] flerd    <div go er  rit    <div.a    <div className="fixed inset-0 bg-black/80 z-[1ss       o           <p    <div epp     ]     <div className="fixedase t          <p    <div epp    0/  return (
tant        {loading ? (
           return (
tant        {loading ?             tant        {loading ? (
           return (
tant        {loading ?             ex                <div classN{s           re            tant        {loadig-tant        {loading ? (
           return (
tant        {loading ?             tant        {loading ? (
           return (
tant        {loading ?             tant            tant     >
               rees           return (
tanPrtant                           return (
tant        {lo            </div>
      tant               )               return (
tanortant        {loadiat           Fatanortant        {loadta    tant        {loa      </div>
    </div>
  tant        {loading ? (
           return (
tant        {loading ?             tant        {loading ? (
           return (
tant        {loading ?             ex             EOF
rm -f components/ClientDetailModal.tsx
rm create_client_modal.js 2>/dev/null
