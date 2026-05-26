'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MusicLoadingIndicator, type Playlist } from '../MusicClient';
import { musicSources, normalizeSource } from '@/lib/music/shared';

export default function MusicRankingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSource, setCurrentSource] = useState(normalizeSource(searchParams.get('source')));
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const source = normalizeSource(searchParams.get('source'));
    setCurrentSource(source);
    setLoading(true);
    fetch(`/api/music/v2/discovery/boards?source=${source}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPlaylists((data.data?.list || []).map((item: any) => ({
            id: item.id,
            name: item.name,
            source: normalizeSource(item.source || data.data?.source || source),
            updateFrequency: item.updateFrequency || item.description || '',
          })));
        } else {
          setPlaylists([]);
        }
      })
      .catch(() => setPlaylists([]))
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 border-b border-white/5 pb-3">
        <h2 className="shrink-0 text-xs font-mono text-white/50 tracking-widest">排行榜</h2>
        <div className="flex max-w-[calc(100vw-7rem)] justify-end overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-inner shadow-black/20 md:max-w-none md:overflow-visible">
          {musicSources.map((source) => {
            const active = currentSource === source.key;
            return (
              <button
                key={source.key}
                onClick={() => router.push(`/music/rankings?source=${source.key}`)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400 text-white shadow-lg shadow-green-500/25'
                    : 'text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {source.label}
              </button>
            );
          })}
        </div>
      </div>
      {loading ? <MusicLoadingIndicator className="py-8" /> : playlists.length > 0 ? (
        <div className="space-y-2">
          {playlists.map((playlist, index) => (
            <button
              key={playlist.id}
              onClick={() => router.push(`/music/rankings/${playlist.source || currentSource}/${encodeURIComponent(playlist.id)}?name=${encodeURIComponent(playlist.name)}`)}
              className="w-full text-left rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 text-sm text-zinc-500 dark:text-zinc-300 font-mono shrink-0">{String(index + 1).padStart(2, '0')}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/90 truncate">{playlist.name}</div>
                  {playlist.updateFrequency ? <div className="text-xs text-zinc-500 mt-1 truncate">{playlist.updateFrequency}</div> : null}
                </div>
                <div className="text-zinc-500 shrink-0">›</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-zinc-400">当前音源暂无排行榜</div>
      )}
    </div>
  );
}
