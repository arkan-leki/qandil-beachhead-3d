import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Check, AlertTriangle, Send } from 'lucide-react';
import { Language } from '../types';
import { I18N } from '../i18n';

interface CheatConsoleProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
  onExecuteCheat: (cmd: string) => { success: boolean; message: string };
}

interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error' | 'cmd';
}

const QUICK_CHEATS = [
  { code: 'god', label: 'God Mode', descEn: 'Invincible', descZh: '无敌模式' },
  { code: 'ammo', label: 'Infinite Ammo', descEn: 'Unlimited ammo', descZh: '无限弹药' },
  { code: 'lock and load', label: 'Lock & Load', descEn: 'Full HP & Ammo', descZh: '满弹药+修碉堡' },
  { code: 'kill them high', label: 'Kill Them High', descEn: 'Destroy active enemies', descZh: '全歼当前敌军' },
  { code: 'skip', label: 'Say Uncle / Skip', descEn: 'Skip to next wave', descZh: '跳过本波次' },
  { code: 'airdrop', label: 'Supply Drop', descEn: 'Allied drop crate', descZh: '呼叫空投补给' },
  { code: 'airstrike', label: 'Airstrike +3', descEn: '+3 Jet strikes', descZh: '补充空中轰炸' },
  { code: 'night', label: 'Toggle Night', descEn: 'Night / Day vision', descZh: '昼夜模式切换' },
];

export const CheatConsole: React.FC<CheatConsoleProps> = ({
  open,
  onClose,
  lang,
  onExecuteCheat,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      text:
        lang === 'zh'
          ? '抢滩登陆 经典战役战术终端就绪。输入秘籍或点按下方指令快捷执行：'
          : 'BEACH HEAD COMMAND CONSOLE READY. Enter classic cheat codes or select from below:',
      type: 'info',
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = I18N[lang];

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!open) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    const res = onExecuteCheat(cmd);
    setLogs((prev) => [
      ...prev,
      { id: Date.now(), text: `> ${cmd}`, type: 'cmd' },
      { id: Date.now() + 1, text: res.message, type: res.success ? 'success' : 'error' },
    ]);
    setInputVal('');
  };

  const handleQuick = (code: string) => {
    const res = onExecuteCheat(code);
    setLogs((prev) => [
      ...prev,
      { id: Date.now(), text: `> ${code}`, type: 'cmd' },
      { id: Date.now() + 1, text: res.message, type: res.success ? 'success' : 'error' },
    ]);
  };

  return (
    <div
      className="absolute inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border-2 border-emerald-500/80 rounded-lg p-3 sm:p-4 w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl text-emerald-400 font-mono"
        style={{ textShadow: '0 0 4px rgba(16, 185, 129, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs sm:text-sm font-black tracking-widest uppercase">
              {lang === 'zh' ? '抢滩登陆 3D · 经典秘籍控制台' : 'BEACH HEAD COMMAND CONSOLE'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-900 rounded text-emerald-500 hover:text-emerald-200 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Output Log Terminal */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-[140px] max-h-[220px] overflow-y-auto bg-black/70 border border-emerald-900/60 rounded p-2.5 mb-2.5 space-y-1 text-[11px] sm:text-xs font-mono leading-relaxed select-text"
        >
          {logs.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-1.5 ${
                log.type === 'cmd'
                  ? 'text-amber-400 font-bold'
                  : log.type === 'success'
                  ? 'text-emerald-300'
                  : log.type === 'error'
                  ? 'text-red-400'
                  : 'text-zinc-400'
              }`}
            >
              {log.type === 'success' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
              {log.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
              <span>{log.text}</span>
            </div>
          ))}
        </div>

        {/* Quick Cheat Buttons */}
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-500/80 mb-1.5 font-bold">
            {lang === 'zh' ? '经典快捷秘籍 (点按即用)' : 'CLASSIC QUICK CHEATS'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {QUICK_CHEATS.map((qc) => (
              <button
                key={qc.code}
                onClick={() => handleQuick(qc.code)}
                className="p-1.5 bg-zinc-900/80 border border-emerald-900/60 hover:border-emerald-500 hover:bg-emerald-950/40 rounded text-left transition-all cursor-pointer flex flex-col"
              >
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-tight truncate">
                  {qc.label}
                </span>
                <span className="text-[9px] text-zinc-400 truncate">
                  {lang === 'zh' ? qc.descZh : qc.descEn}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={t.enterCheatPrompt}
              className="w-full bg-black border border-emerald-700/80 rounded pl-7 pr-3 py-1.5 text-xs text-emerald-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs rounded transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>{lang === 'zh' ? '执行' : 'RUN'}</span>
          </button>
        </form>

        {/* Shortcut notice */}
        <div className="text-[9px] text-zinc-500 mt-2 text-center">
          {lang === 'zh'
            ? '提示: 游戏中按 [~] 或 [F9] 可随时呼出控制台，按 [+] 可直接跳关'
            : 'Shortcut: Press [`~`] or [F9] during game to open console, [+] to skip wave'}
        </div>
      </div>
    </div>
  );
};
