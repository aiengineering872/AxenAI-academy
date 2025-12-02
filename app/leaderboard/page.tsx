'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  photoURL?: string;
  xp: number;
  level: number;
  badges: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('xp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const entries: LeaderboardEntry[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          entries.push({
            rank: 0, // Will be set after sorting
            userId: doc.id,
            name: data.displayName || data.name || 'Learner',
            photoURL: data.photoURL || undefined,
            xp: data.xp || 0,
            level: data.level || 1,
            badges: Array.isArray(data.badges) ? data.badges.length : 0,
          });
        });

        // Sort by XP (descending) and assign ranks
        entries.sort((a, b) => b.xp - a.xp);
        entries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(entries);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching leaderboard:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-400" />;
    return <span className="text-lg font-bold text-textSecondary">#{rank}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-text mb-2">Leaderboard</h1>
          <p className="text-textSecondary">Top performers and achievements</p>
        </motion.div>

        {/* Filter */}
        <div className="flex gap-4">
          {(['all', 'weekly', 'monthly'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === f
                  ? 'bg-primary text-white'
                  : 'bg-card text-textSecondary hover:text-text'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[2, 1, 3].map((rank) => {
            const entry = leaderboard.find((e) => e.rank === rank);
            if (!entry) return null;
            return (
              <motion.div
                key={rank}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rank * 0.1 }}
                className={`bg-black modern-card glow-border p-6 rounded-xl text-center ${
                  rank === 1 ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'
                }`}
              >
                <div className="mb-4">{getRankIcon(rank)}</div>
                {entry.photoURL ? (
                  <img
                    src={entry.photoURL}
                    alt={entry.name}
                    className="w-16 h-16 rounded-full mx-auto mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl">
                    {entry.name[0]}
                  </div>
                )}
                <h3 className="font-bold text-text mb-1">{entry.name}</h3>
                <p className="text-sm text-textSecondary mb-2">Level {entry.level}</p>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium">{entry.xp.toLocaleString()} XP</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="bg-black modern-card glow-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-card/50">
                <tr>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Rank</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Learner</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Level</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">XP</th>
                  <th className="text-left py-4 px-6 text-textSecondary font-medium">Badges</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-textSecondary">
                      Loading leaderboard...
                    </td>
                  </tr>
                ) : leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-textSecondary">
                      No users found
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    className={`border-t border-card hover:bg-card/50 transition-all ${
                      user?.uid === entry.userId ? 'bg-primary/10' : ''
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {entry.photoURL ? (
                          <img
                            src={entry.photoURL}
                            alt={entry.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                            {entry.name[0]}
                          </div>
                        )}
                        <span className="font-medium text-text">{entry.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-text">Level {entry.level}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-medium text-text">{entry.xp.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1">
                        <Award className="w-4 h-4 text-primary" />
                        <span className="text-text">{entry.badges}</span>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

