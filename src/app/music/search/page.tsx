'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { playMusicList } from '@/lib/music/actions';
import { MusicLoadingIndicator, type Song } from '../MusicClient';
import SongList from '../SongList';
import { mapSong, musicSources, normalizeSource } from '@/lib/music/shared';

export default function MusicSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = normalizeSource(searchParams.get('source'));
  const q = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(q);
  const [selectedSource, setSelectedSource] = useState(source);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);

  useEffect(() => {
    setSelectedSource(source);
    setKeyword(q);
    if (!q) {
      setSongs([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/music/v2/search?source=${source}&q=${encodeURIComponent(q)}&page=1&limit=20`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setSongs((data.data?.list || []).map(mapSong)))
      .catch((error) => {
        if (error?.name !== 'AbortError') setSongs([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [source, q]);

  const submit = () => {
    const next = keyword.trim();
    if (next) router.push(`/music/search?source=${source}&q=${encodeURIComponent(next)}`);
  };

  const changeSource = (nextSource: string) => {
    const normalizedSource = normalizeSource(nextSource);
    const next = keyword.trim() || q;
    setSelectedSource(normalizedSource);
    setShowSourceMenu(false);
    router.push(`/music/search?source=${normalizedSource}${next ? `&q=${encodeURIComponent(next)}` : ''}`);
  };

  const currentSourceLabel = musicSources.find((item) => item.key === selectedSource)?.label || '音源';

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <div className="relative h-11 flex-1 rounded-xl border border-white/10 bg-white/10">
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} className="h-full w-full border-0 bg-transparent pl-10 pr-28 text-sm text-white outline-none placeholder:text-zinc-500" placeholder="搜索歌曲或艺术家..." />
          <div className="absolute inset-y-0 right-2 flex items-center">
            <div className="relative h-8">
              <button
                type="button"
                onClick={() => setShowSourceMenu((open) => !open)}
                className="flex h-8 min-w-[84px] items-center justify-between gap-1 rounded-lg border border-white/10 bg-zinc-900/90 pl-3 pr-2 text-xs font-medium text-white shadow-inner shadow-white/5 transition-colors hover:bg-zinc-800"
                aria-haspopup="listbox"
                aria-expanded={showSourceMenu}
                aria-label="选择音源"
              >
                <span>{currentSourceLabel}</span>
                <svg className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${showSourceMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showSourceMenu && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setShowSourceMenu(false)}
                    aria-label="关闭音源菜单"
                  />
                  <div className="absolute right-0 top-10 z-50 w-32 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 p-1 shadow-2xl shadow-black/50 backdrop-blur-md" role="listbox">
                    {musicSources.map((item) => {
                      const active = item.key === selectedSource;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => changeSource(item.key)}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                            active ? 'bg-green-500/20 text-green-300' : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                          }`}
                          role="option"
                          aria-selected={active}
                        >
                          <span>{item.label}</span>
                          {active && (
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <button onClick={submit} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-700" aria-label="搜索" title="搜索">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-2">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl font-bold text-white/80 tracking-tight truncate max-w-md">{q ? `搜索: ${q}` : '搜索'}</h2>
          <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded text-white shrink-0">{songs.length} 首歌曲</span>
        </div>
        <button onClick={() => playMusicList(songs, q ? `搜索: ${q}` : '搜索结果')} disabled={songs.length === 0} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm text-white shrink-0">播放全部</button>
      </div>
      {loading ? <MusicLoadingIndicator className="py-8" /> : q ? <SongList songs={songs} /> : <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-zinc-400">输入关键词开始搜索</div>}
    </div>
  );
}
