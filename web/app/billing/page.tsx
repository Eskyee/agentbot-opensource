'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import CoinbaseWalletButton from '../components/CoinbaseWallet'

const navItems = [
  { icon: '🤖', label: 'Agents', href: '/agents', active: false },
  { icon: '🛒', label: 'Marketplace', href: '/marketplace', active: false },
  { icon: '💳', label: 'Billing', href: '/billing', active: true },
  { icon: '⚙️', label: 'Account', href: '/settings', active: false },
]

function BillingSidebar({ userName, className = '' }: { userName: string; className?: string }) {
  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                item.active 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>

        <Link href="/billing" className="block mt-8 p-4 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
          <div className="text-sm text-blue-400 mb-1">Manage</div>
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-black">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{userName}</div>
            <div className="text-sm text-blue-400">Sign up</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default function BillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentPlan, setCurrentPlan] = useState('underground')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/billing')
    }
  }, [status, router])

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'Sign in'

  useEffect(() => {
    const fetchBillingData = async () => {
      if (!session?.user?.id) return
      try {
        const res = await fetch(`/api/instance/${session.user.id}`)
        if (res.ok) {
          const data = await res.json()
          setCurrentPlan(data.plan || 'underground')
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchBillingData()
  }, [session])

  const plans = [
    {
      id: 'underground',
      name: 'Underground',
      specs: '1 Agent · Mistral 7B',
      price: 29,
      priceId: 'underground',
      features: ['Telegram channel', 'Use your own AI key', 'A2A Bus Access', 'Basic Analytics'],
    },
    {
      id: 'collective',
      name: 'Collective',
      specs: '3 Agents · Llama 3.3',
      price: 69,
      priceId: 'collective',
      features: ['Royalty Split Engine', 'Mission Control Graph', 'Telegram + WhatsApp', 'Priority support'],
      popular: true,
    },
    {
      id: 'label',
      name: 'Label',
      specs: 'Unlimited · DeepSeek R1',
      price: 199,
      priceId: 'label',
      features: ['Priority A2A Routing', '24/7 Signal Guard', 'White-glove staging', 'Custom integrations'],
    },
  ]

  const buyPlan = async (priceId: string) => {
    try {
      // Use GET request to Stripe checkout route
      window.location.href = `/api/stripe/checkout?plan=${priceId}`
    } catch (error) {
      console.error('Failed to initiate checkout:', error)
      alert('Failed to start checkout')
    }
  }

  const connectWallet = () => {
    alert('Coinbase Wallet integration coming soon!')
  }

  const contactSales = () => {
    window.location.href = 'mailto:sales@agentbot.com?subject=Custom Infrastructure Inquiry'
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading…</div>
      </div>
    )
  }

   return (
     <div className="min-h-screen bg-black text-white">
       {/* Mobile Sidebar */}
       <div className="md:hidden">
         <BillingSidebar userName={userName} className="mb-6" />
       </div>

       <main className="px-4 sm:px-6 py-8">
         <div className="max-w-4xl mx-auto">
           <h1 className="text-2xl sm:text-3xl font-bold mb-6">Billing</h1>

           {loading ? (
             <div className="text-center py-6 text-gray-400">Loading...</div>
           ) : (
             <React.Fragment>
               {/* API Keys */}
               <div className="mb-4">
                 <h2 className="text-lg font-semibold mb-3">AI API Keys</h2>
                 <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                   <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                       <span className="text-xl">🔑</span>
                     </div>
                     <div>
                       <div className="font-medium">Bring Your Own API Key</div>
                       <div className="text-sm text-gray-400">Pay directly to AI providers - no markup</div>
                     </div>
                   </div>
                   <p className="text-sm text-gray-400 mb-2">
                     Users provide their own API keys from OpenRouter, Groq, Anthropic, or OpenAI. 
                     You get the best rates directly from the source. No credit system needed.
                   </p>
                   <a href="/settings" className="w-full text-center rounded-lg bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-200">
                     Configure API Keys
                   </a>
                 </div>
               </div>

               {/* USDC on Base */}
               <div className="mb-4">
                 <h2 className="text-lg font-semibold mb-3">Pay with USDC</h2>
                 <div className="rounded-xl border border-gray-800 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4">
                   <div className="flex items-center justify-between mb-3">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                         <span className="text-xl">💵</span>
                       </div>
                       <div>
                         <div className="font-medium">USDC on Base</div>
                         <div className="text-sm text-gray-400">Instant, low-fee payments</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-lg font-bold">0% fees</div>
                       <div className="text-sm text-gray-500">via Coinbase</div>
                     </div>
                   </div>
                   <p className="text-sm text-gray-400 mb-2">
                     Pay with USDC on Base for instant settlement and near-zero fees. 
                     Connect your wallet to get started.
                   </p>
                   <div className="flex gap-2">
                     <button 
                       onClick={connectWallet}
                       className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-medium hover:from-blue-600 hover:to-purple-700"
                     >
                       Connect Wallet
                     </button>
                     <a 
                       href="https://commerce.coinbase.com" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full text-center rounded-lg border border-gray-700 text-sm font-medium hover:bg-gray-800"
                     >
                       Learn More
                     </a>
                   </div>
                 </div>
               </div>

               {/* Machines / Subscriptions */}
               <div className="mb-4">
                 <h2 className="text-lg font-semibold mb-3">Machines</h2>
                 <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3 mb-3">
                   <div className="text-sm text-gray-400">0 of 1 in use</div>
                 </div>

                 <div className="space-y-3">
                   {plans.map((plan) => (
                     <div
                       key={plan.id}
                       className={`relative rounded-lg border p-3 ${
                         plan.popular 
                           ? 'border-white bg-white/5' 
                           : 'border-gray-800 bg-gray-900/50'
                       }`}
                     >
                       {plan.popular && (
                         <span className="absolute -top-2 left-2 bg-white text-black text-xs px-2 py-1 rounded">
                           POPULAR
                         </span>
                       )}
                       <div className="flex items-center justify-between">
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className="font-medium text-base">{plan.name}</h3>
                             {currentPlan === plan.id && (
                               <span className="text-xs bg-green-500/20 text-green-400 px-1 py-0.5 rounded">Current</span>
                             )}
                           </div>
                           <div className="text-sm text-gray-400">{plan.specs}</div>
                           <div className="text-xs text-gray-500 mt-1">
                             £{plan.price}/mo
                           </div>
                         </div>
                         <div className="flex items-center gap-2">
                           <select className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" title="Select quantity">
                             <option>1</option>
                             <option>2</option>
                             <option>3</option>
                           </select>
                           <button 
                             onClick={() => buyPlan(plan.priceId)}
                             className={`w-full mt-2 rounded-lg px-4 py-2 font-medium ${
                               currentPlan === plan.id 
                                 ? 'bg-gray-800 text-gray-400' 
                                 : 'bg-white hover:bg-gray-200 text-black'
                             }`}>
                             {currentPlan === plan.id ? 'Current' : 'Buy'}
                           </button>
                         </div>
                       </div>
                       <div className="flex gap-2 mt-2">
                         {plan.features.map((f, index) => (
                           <span key={`${f}-${index}`} className="inline-block text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded mr-1 mb-1">
                             {f}
                           </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enterprise Add-ons */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4">Enterprise Add-ons</h2>
                  <p className="text-sm text-gray-400 mb-4">Supercharge your agents with enterprise integrations</p>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">🔐 Audit Logs</h3>
                        <span className="text-sm font-bold">+£199/mo</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">Full traceability of every agent action & decision</p>
                      <button className="w-full rounded bg-gray-800 py-2 text-xs font-medium hover:bg-gray-700">
                        Add to Plan
                      </button>
                    </div>

                    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">💬 Slack Integration</h3>
                        <span className="text-sm font-bold">+£149/mo</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">Agents work inside your Slack workspace</p>
                      <button className="w-full rounded bg-gray-800 py-2 text-xs font-medium hover:bg-gray-700">
                        Add to Plan
                      </button>
                    </div>

                    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">☁️ Salesforce Connector</h3>
                        <span className="text-sm font-bold">+£349/mo</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">Sync leads, contacts, and opportunities automatically</p>
                      <button className="w-full rounded bg-gray-800 py-2 text-xs font-medium hover:bg-gray-700">
                        Add to Plan
                      </button>
                    </div>

                    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">🔌 API Access</h3>
                        <span className="text-sm font-bold">+£249/mo</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">Programmatic access to your agents via REST API</p>
                      <button className="w-full rounded bg-gray-800 py-2 text-xs font-medium hover:bg-gray-700">
                        Add to Plan
                      </button>
                    </div>

                    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">🎯 Custom Integration</h3>
                        <span className="text-sm font-bold">+£499/mo</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">We build a custom connector for your tools</p>
                      <button className="w-full rounded bg-gray-800 py-2 text-xs font-medium hover:bg-gray-700">
                        Request Quote
                      </button>
                    </div>

                    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">👤 Dedicated Account Manager</h3>
                        <span className="text-sm font-bold">+£399/mo</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">Priority support & personalized onboarding</p>
                      <button className="w-full rounded bg-gray-800 py-2 text-xs font-medium hover:bg-gray-700">
                        Add to Plan
                      </button>
                    </div>

                    <div className="border-2 border-purple-500 rounded-lg p-4 bg-purple-500/10 col-span-full">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-purple-400 text-lg">🚀 Full Enterprise Suite</h3>
                        <span className="text-lg font-bold text-purple-400">£4,999/mo</span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">Everything enterprise:</p>
                      <ul className="text-xs text-gray-300 mb-2 space-y-1">
                        <li>✓ Unlimited AI Agents with hierarchical task delegation</li>
                        <li>✓ Enterprise SSO/SAML & Role-based access control (RBAC)</li>
                        <li>✓ Credential isolation & zero-trust security</li>
                        <li>✓ Full audit logging & compliance tooling</li>
                        <li>✓ Pre-built connectors: Salesforce, Cisco, Google Cloud, Adobe, CrowdStrike</li>
                        <li>✓ Tool use framework for external APIs</li>
                        <li>✓ Hardware agnostic (NVIDIA, AMD, Intel support)</li>
                        <li>✓ 24/7 Priority support & SLA guarantee</li>
                        <li>✓ Mission Control dashboard & analytics</li>
                      </ul>
                      <p className="text-xs text-gray-500 mb-4">Matches NemoClaw Enterprise spec — but we manage everything for you</p>
                      <button className="w-full rounded bg-purple-600 py-3 text-sm font-bold hover:bg-purple-500">
                        Contact Sales
                      </button>
                    </div>
                  </div>
                </div>

                {/* Need custom */}
               <div className="mt-4">
                 <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center">
                   <h3 className="font-medium mb-2">Need custom infrastructure?</h3>
                   <p className="text-sm text-gray-400 mb-2">
                     Volume discounts, dedicated support, and custom integrations.
                   </p>
                   <button 
                     onClick={contactSales}
                     className="w-full rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-800"
                   >
                     Contact Sales
                   </button>
                 </div>
               </div>
             </React.Fragment>
           )}
         </div>
       </main>
     </div>
   );
}
