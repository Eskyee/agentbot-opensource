'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail, CheckCircle2, XCircle, Clock, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BookingInboxPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['talent-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/mission-control/fleet/bookings'); // Needs backend route
      return res.json();
    },
    refetchInterval: 5000
  });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-mono">
      <main className="px-6 py-16">
      <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 uppercase tracking-tighter">Talent Booking Inbox</h1>
          <p className="text-zinc-400">Manage autonomous booking offers and contracts for your talent agents.</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 px-4 py-2 rounded-lg">
          <span className="text-blue-400 text-xs font-mono font-bold uppercase tracking-widest">A2A NEGOTIATOR ACTIVE</span>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-zinc-900 rounded-xl border border-zinc-800" />)}
          </div>
        ) : bookings?.length === 0 ? (
          <div className="py-20 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
            <Mail className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-tighter">No active booking requests</h3>
            <p className="text-sm text-zinc-500 mt-1">Your agent will notify you when an offer is received via the A2A bus.</p>
          </div>
        ) : (
          bookings?.map((booking: any) => (
            <div key={booking.id} className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg">{booking.talent_name || 'Guest Artist'}</h3>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                      booking.status === 'offered' ? "bg-yellow-500/20 text-yellow-400" :
                      booking.status === 'accepted' ? "bg-green-500/20 text-green-400" :
                      "bg-zinc-500/20 text-zinc-400"
                    )}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-500">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(booking.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 font-mono text-green-500/80"><DollarSign className="h-3 w-3" /> {booking.offer_amount_usdc} USDC</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {booking.status === 'offered' && (
                  <>
                    <button className="px-4 py-2 bg-white text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Accept
                    </button>
                    <button className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-zinc-700 transition-colors flex items-center gap-2">
                      <XCircle className="h-4 w-4" /> Decline
                    </button>
                  </>
                )}
                {booking.status === 'accepted' && (
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Onchain Contract</div>
                    <div className="font-mono text-xs text-blue-400 truncate w-32">0x{booking.contract_tx_hash || 'pending...'}</div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      </div>
      </main>
    </div>
  );
}
