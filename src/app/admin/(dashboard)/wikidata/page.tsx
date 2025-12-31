'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Download,
  Check,
  ExternalLink,
  Users,
  Clock,
  Calendar,
  Loader2,
  Database,
  Globe,
} from 'lucide-react';

interface WikidataGame {
  wikidataId: string;
  name: string;
  description?: string;
  yearPublished?: number;
  minPlayers?: number;
  maxPlayers?: number;
  playTimeMinutes?: number;
  imageUrl?: string;
  officialWebsite?: string;
  bggId?: string;
  designers: string[];
  publishers: string[];
  existsInDb?: boolean;
  existingSlug?: string;
}

interface Stats {
  wikidata_total: number;
  imported_from_wikidata: number;
  total_games: number;
}

export default function WikidataAdminPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<WikidataGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Load stats on mount
  useEffect(() => {
    fetch('/api/admin/wikidata?action=stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;

    setIsSearching(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/wikidata?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      if (data.error) {
        setMessage({ type: 'error', text: data.error });
        setResults([]);
      } else {
        setResults(data.results || []);
        if (data.results?.length === 0) {
          setMessage({ type: 'error', text: 'No games found in Wikidata' });
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Search failed' });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (game: WikidataGame) => {
    setImportingId(game.wikidataId);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/wikidata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Imported "${data.game.name}" successfully!`,
        });

        // Update the result to show it exists now
        setResults((prev) =>
          prev.map((r) =>
            r.wikidataId === game.wikidataId
              ? { ...r, existsInDb: true, existingSlug: data.game.slug }
              : r
          )
        );

        // Update stats
        if (stats) {
          setStats({
            ...stats,
            imported_from_wikidata: stats.imported_from_wikidata + 1,
            total_games: stats.total_games + 1,
          });
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Import failed',
        });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Import failed' });
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Wikidata Import</h1>
          <p className="text-muted-foreground">
            Search and import games from Wikidata (CC0 licensed)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Wikidata Total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.wikidata_total.toLocaleString() : '...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Board games in Wikidata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Imported from Wikidata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats ? stats.imported_from_wikidata : '...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Games with data_source = wikidata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Total Games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.total_games : '...'}
            </div>
            <p className="text-xs text-muted-foreground">In your database</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Wikidata</CardTitle>
          <CardDescription>
            Search for board games by name. Results show data available in
            Wikidata.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for a game (e.g., Catan, Wingspan, Azul)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {message && (
            <div
              className={`mt-4 rounded-md p-3 text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Results ({results.length})
          </h2>

          <div className="grid gap-4">
            {results.map((game) => (
              <Card key={game.wikidataId} className="overflow-hidden">
                <div className="flex">
                  {/* Image */}
                  {game.imageUrl && (
                    <div className="w-32 flex-shrink-0">
                      <img
                        src={game.imageUrl}
                        alt={game.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{game.name}</h3>
                        {game.description && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {game.description}
                          </p>
                        )}
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {game.existsInDb ? (
                          <Link href={`/admin/games/${game.existingSlug}`}>
                            <Button variant="outline" size="sm">
                              <Check className="mr-1 h-3 w-3 text-green-600" />
                              View in Admin
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleImport(game)}
                            disabled={importingId === game.wikidataId}
                          >
                            {importingId === game.wikidataId ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Download className="mr-1 h-3 w-3" />
                            )}
                            Import
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {game.yearPublished && (
                        <Badge variant="secondary">
                          <Calendar className="mr-1 h-3 w-3" />
                          {game.yearPublished}
                        </Badge>
                      )}
                      {(game.minPlayers || game.maxPlayers) && (
                        <Badge variant="secondary">
                          <Users className="mr-1 h-3 w-3" />
                          {game.minPlayers || '?'}-{game.maxPlayers || '?'}{' '}
                          players
                        </Badge>
                      )}
                      {game.playTimeMinutes && (
                        <Badge variant="secondary">
                          <Clock className="mr-1 h-3 w-3" />
                          {game.playTimeMinutes} min
                        </Badge>
                      )}
                      {game.bggId && (
                        <Badge variant="outline">BGG: {game.bggId}</Badge>
                      )}
                      <Badge variant="outline" className="text-muted-foreground">
                        {game.wikidataId}
                      </Badge>
                    </div>

                    {/* Designers & Publishers */}
                    {(game.designers.length > 0 ||
                      game.publishers.length > 0) && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {game.designers.length > 0 && (
                          <span>
                            Design: {game.designers.slice(0, 3).join(', ')}
                          </span>
                        )}
                        {game.designers.length > 0 &&
                          game.publishers.length > 0 && <span> · </span>}
                        {game.publishers.length > 0 && (
                          <span>
                            Publisher: {game.publishers.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    )}

                    {/* External Links */}
                    <div className="mt-2 flex gap-3 text-xs">
                      <a
                        href={`https://www.wikidata.org/wiki/${game.wikidataId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Wikidata
                      </a>
                      {game.bggId && (
                        <a
                          href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          BGG
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
