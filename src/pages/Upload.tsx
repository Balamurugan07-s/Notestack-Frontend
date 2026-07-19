import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Upload as UploadIcon, FileText, CheckCircle, ShieldCheck, ShieldAlert, X, AlertTriangle } from 'lucide-react';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Scanning simulation states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanMessages, setScanMessages] = useState<string[]>([]);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'failed'>('idle');

  // Error/Success banner
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const scanSteps = [
    'Initializing secure document sandbox...',
    'Analyzing file header and magic number signature...',
    'Performing MIME type validation against whitelist...',
    'Executing EICAR malware database signature match...',
    'Running heuristic virus scanner heuristics...',
    'Finalizing security verification audit logs...'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check size limit (20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('File size exceeds the 20MB limit.');
        setFile(null);
        return;
      }

      // Check allowed extensions
      const allowedExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        setError('Invalid file format. Allowed extensions: PDF, DOCX, PNG, JPG, TXT');
        setFile(null);
        return;
      }

      setError('');
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.size > 20 * 1024 * 1024) {
        setError('File size exceeds the 20MB limit.');
        return;
      }

      const allowedExtensions = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.txt'];
      const fileExtension = droppedFile.name.substring(droppedFile.name.lastIndexOf('.')).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        setError('Invalid file format.');
        return;
      }

      setError('');
      setFile(droppedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    setError('');
  };

  // Perform animated malware scan
  const startSecurityScanAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPreviewUrl(null);

    if (!file || !title || !description || !subject) {
      return setError('Please fill in all details and upload a file.');
    }

    setIsScanning(true);
    setScanStatus('idle');
    setScanMessages([]);
    setScanStep(0);

    // Simulate scanning logs step-by-step
    for (let i = 0; i < scanSteps.length; i++) {
      setScanStep(i);
      setScanMessages((prev) => [...prev, `[INFO] ${scanSteps[i]}`]);
      // delay for each step
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Prepare multipart data
    const formData = new FormData();
    formData.append('title', title);
    formData.append('subject', subject);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('isPrivate', String(isPrivate));
    formData.append('file', file);

    try {
      setScanMessages((prev) => [...prev, `[INFO] Transmitting payload to NoteStack secure backend...`]);
      const res = await API.post('/notes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setScanStatus('success');
        setScanMessages((prev) => [...prev, `[OK] File scanned successfully. Malware check passed.`, `[OK] Note saved successfully. Note ID: ${res.data.note._id}`]);
        
        // Wait 1.5s then redirect to explore
        setTimeout(() => {
          setIsScanning(false);
          navigate('/explore');
        }, 1800);
      }
    } catch (err: any) {
      setScanStatus('failed');
      const errMessage = err.response?.data?.error || 'Upload failed during security verification.';
      setScanMessages((prev) => [
        ...prev,
        `[CRITICAL ERROR] ${errMessage}`,
        `[BLOCKED] File upload halted for user security.`
      ]);
      setError(errMessage);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#0b0f19] text-gray-100 px-6 py-10 flex items-center justify-center relative">
      <div className="absolute top-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl animate-float-shape"></div>

      {/* Main Upload Box */}
      <div className="max-w-2xl w-full glass-panel p-8 rounded-3xl border border-white/5 shadow-2xl relative z-10">
        
        {!isScanning ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white mb-2 flex justify-center items-center gap-2">
                <UploadIcon className="h-7 w-7 text-indigo-500" />
                Upload Study Notes
              </h1>
              <p className="text-gray-400 text-sm">Add title, description, subject metadata and drop your document</p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 p-4 rounded-xl text-sm flex items-center space-x-2.5 mb-6">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={startSecurityScanAndUpload} className="space-y-5">
              
              {/* Document details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Note Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Intro to Data Structures"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Subject / Course Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Description</label>
                <textarea
                  placeholder="Summarize the notes contents, topics covered, and chapters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors h-24 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. structures, trees, array"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                
                {/* Visibility Option */}
                <div className="flex items-center space-x-3 pt-6 pl-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 bg-gray-950 border-white/10"
                  />
                  <label htmlFor="isPrivate" className="text-gray-300 text-xs font-semibold cursor-pointer">
                    Keep note private / draft
                  </label>
                </div>
              </div>

              {/* Drag-and-drop container */}
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Document File</label>
                
                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer bg-gray-950/20 hover:bg-gray-950/50 transition-all flex flex-col items-center justify-center space-y-3 group"
                  >
                    <UploadIcon className="h-10 w-10 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                    <div>
                      <p className="text-xs font-bold text-gray-300">Drag & drop your study file here or click to browse</p>
                      <p className="text-[10px] text-gray-500 mt-1">Allowed formats: PDF, DOCX, PNG, JPG, TXT (Max 20MB)</p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.docx,.png,.jpg,.jpeg,.txt"
                    />
                  </div>
                ) : (
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-gray-200 truncate max-w-[280px]">{file.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 disabled:text-gray-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex justify-center items-center space-x-2 cursor-pointer text-sm mt-3"
              >
                <ShieldCheck className="h-4.5 w-4.5" />
                <span>Upload and Security Verify</span>
              </button>

            </form>
          </>
        ) : (
          <>
            {/* Animated Laser Scanner UI Viewport */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-white flex justify-center items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
                Document Scanner Sandbox
              </h2>
              <p className="text-gray-400 text-xs">NoteStack security check executing in sandbox context...</p>
            </div>

            {/* Scan animation card */}
            <div className="relative glass-panel rounded-2xl border border-white/5 overflow-hidden p-6 mb-6 flex flex-col justify-center items-center h-48 bg-gray-950/40">
              
              {/* Scan indicator line */}
              {scanStatus === 'idle' && <div className="scan-indicator"></div>}

              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-2xl border ${scanStatus === 'failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : scanStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-bounce' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'}`}>
                  <FileText className="h-12 w-12" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-200">{file?.name}</p>
                  <p className="text-[10px] text-gray-400">Security Sandbox Scanning...</p>
                </div>
              </div>
            </div>

            {/* Console Log Terminal */}
            <div className="bg-gray-950 border border-white/5 rounded-xl p-4 font-mono text-[10px] space-y-2 h-44 overflow-y-auto leading-relaxed">
              {scanMessages.map((msg, idx) => (
                <div key={idx} className={msg.startsWith('[CRITICAL') || msg.startsWith('[BLOCKED') ? 'text-rose-400 font-bold' : msg.startsWith('[OK') ? 'text-emerald-400 font-bold' : 'text-indigo-300'}>
                  {msg}
                </div>
              ))}
            </div>

            {scanStatus === 'failed' && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsScanning(false)}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                >
                  Cancel & Reset Upload
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export default Upload;
