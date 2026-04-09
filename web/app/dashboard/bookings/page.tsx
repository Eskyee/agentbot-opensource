'use client';

import { useQuery } from '@tanstack/react-query';
import { Mail, CheckCircle2, XCircle, Clock, DollarSign, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'
import { SectionHeader } from '@/app/components/shared/SectionHeader'
import StatusPill from '@/app/components/shared/StatusPill'

export default function BookingInboxPage() {
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['talent-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/mission-control/fleet/bookings');
      return res.json();
    },
    refetchInterval: 5000
  });

  const InboxIcon = () => (
    <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="square" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )

  return (
    <DashboardShell>
      <DashboardHeader
        title="Talent Booking Inbox"
        icon={<InboxIcon />}
        count={bookings?.length}
        action={
          <div className="border border-blue-500/30 bg-blue-500/10 px-3 py-1.5">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">A2A Negotiator Active</span>
          </div>
        }
      />

      <DashboardContent className="max-w-6xl space-y-6">
        <SectionHeader
          label="Bookings"
          title="Autonomous Booking Offers"
          description="Manage booking offers and contracts for your talent agents"
        />

        <div className="space-y-px bg-zinc-800">
          {isLoading ? (
            <div className="space-y-px bg-zinc-800">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-zinc-950 border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : bookings?.length === 0 ? (
            <div className="border border-zinc-800 bg-zinc-950 py-20 text-center">
              <Mail className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-tight">No Active Booking Requests</h3>
              <p className="text-xs text-zinc-500 mt-2">Your agent will notify you when an offer is received via the A2A bus.</p>
            </div>
          ) : (
            bookings?.map((booking: any) => (
              <div key={booking.id} className="bg-zinc-950 border border-zinc-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-800 flex items-center justify-center border border-zinc-700">
                    <User className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-bold tracking-tight uppercase">{booking.talent_name || 'Guest Artist'}</h3>
                      <StatusPill
                        status={
                          booking.status === 'offered' ? 'idle' :
                          booking.status === 'accepted' ? 'active' :
                          'offline'
                        }
                        label={booking.status}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(booking.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1 text-green-500/80">
                        <DollarSign className="h-3 w-3" />
                        {booking.offer_amount_usdc} USDC
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {booking.status === 'offered' && (
                    <>
                      <button className="bg-white text-black py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 px-4 flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Accept
                      </button>
                      <button className="border border-zinc-700 hover:border-zinc-500 text-white text-[10px] font-bold uppercase tracking-widest py-2 px-4 flex items-center gap-2">
                        <XCircle className="h-3 w-3" /> Decline
                      </button>
                    </>
                  )}
                  {booking.status === 'accepted' && (
                    <div className="text-right">
                      <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Onchain Contract</div>
                      <div className="font-mono text-[10px] text-blue-400 truncate w-32">0x{booking.contract_tx_hash || 'pending...'}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DashboardContent>
    </DashboardShell>
  );
}
