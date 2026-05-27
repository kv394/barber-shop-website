'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function GlobalVoiceNoteFAB({ shopId }: { shopId: string }) {
 const router = useRouter();
 const [isRecording, setIsRecording] = useState(false);
 const [isProcessing, setIsProcessing] = useState(false);
 const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
 
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const audioChunksRef = useRef<Blob[]>([]);

 const startRecording = async () => {
 setFeedback(null);
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 const mediaRecorder = new MediaRecorder(stream);
 mediaRecorderRef.current = mediaRecorder;
 audioChunksRef.current = [];

 mediaRecorder.ondataavailable = (event) => {
 if (event.data.size > 0) {
 audioChunksRef.current.push(event.data);
 }
 };

 mediaRecorder.onstop = async () => {
 const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
 await processVoiceNote(audioBlob);
 stream.getTracks().forEach(track => track.stop());
 };

 mediaRecorder.start();
 setIsRecording(true);
 setFeedback({ type: 'info', message: 'Recording... Tap again to save or navigate.' });
 } catch (err) {
 setFeedback({ type: 'error', message: 'Mic permission denied.' });
 }
 };

 const stopRecording = () => {
 if (mediaRecorderRef.current && isRecording) {
 mediaRecorderRef.current.stop();
 setIsRecording(false);
 }
 };

 const processVoiceNote = async (audioBlob: Blob) => {
 setIsProcessing(true);
 setFeedback({ type: 'info', message: 'AI is analyzing command...' });
 
 try {
 const fd = new FormData();
 fd.append('audio', audioBlob, 'voice-note.webm');

 const res = await fetch(`/api/shops/${shopId}/voice-notes/global`, {
 method: 'POST',
 body: fd
 });

 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Failed to process voice command');

 if (data.intent === 'navigate') {
 setFeedback({ type: 'success', message: `Navigating to ${data.matchedClientName}...` });
 router.push(`/shop/${shopId}/clients?openClient=${data.clientId}`);
 } else {
 setFeedback({ type: 'success', message: `Saved notes to ${data.matchedClientName}'s profile!` });
 }
 setTimeout(() => setFeedback(null), 5000);
 } catch (err: any) {
 setFeedback({ type: 'error', message: err.message });
 setTimeout(() => setFeedback(null), 8000);
 } finally {
 setIsProcessing(false);
 }
 };

 return (
 <div className="fixed bottom-36 sm:bottom-24 right-4 sm:right-8 z-[9998] flex flex-col items-end gap-2 pointer-events-none">
 {/* Tooltip / Feedback bubble */}
 {feedback && (
 <div className={`pointer-events-auto shadow-lg rounded-xl p-3 text-[13px] font-medium max-w-[250px] animate-fade-in-up
 ${feedback.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
 feedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
 'bg-gray-800 text-white border border-gray-700'}`}
 >
 {feedback.message}
 </div>
 )}

 {/* Main FAB */}
 <button
 type="button"
 onClick={isRecording ? stopRecording : startRecording}
 disabled={isProcessing}
 className={`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 focus:outline-none hover:scale-105 active:scale-95
 ${isRecording 
 ? 'bg-status-cancelled text-white animate-pulse' 
 : isProcessing 
 ? 'bg-gray-300 text-crm-muted'
 : 'bg-crm-primary text-white hover:bg-crm-primary/90'
 }`}
 aria-label="Quick Voice Note"
 >
 {isRecording ? (
 <span className="text-xl">🛑</span>
 ) : isProcessing ? (
 <span className="text-xl animate-spin">⏳</span>
 ) : (
 <span className="text-xl">🎤</span>
 )}
 </button>
 </div>
 );
}
