'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Search, ExternalLink, Building } from 'lucide-react'
import {
  DashboardShell,
  DashboardHeader,
  DashboardContent,
} from '@/app/components/shared/DashboardShell'

interface Job {
  id: string
  title: string
  description: string
  salaryMin: number
  salaryMax: number
  salaryCurrency: string
  roleType: string
  techStack: string[]
  seniority: string
  contractType: string
  webType: string
  applyUrl: string
  status: string
  viewCount: number
  applyCount: number
  publishedAt: string | null
  company: {
    name: string
    slug: string
    logoUrl: string | null
    website: string
  }
  source?: string
}

const ROLE_TYPES = ['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'data', 'design', 'other']
const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'staff', 'lead']
const CONTRACT_TYPES: Record<string, string> = { clt: 'Full-time', pj: 'Contractor', contract: 'Contract' }
const WEB_TYPES: Record<string, string> = { web2: 'Web2', web3: 'Web3', both: 'Web2+Web3' }

const formatSalary = (min: number, max: number, currency: string) => {
  const formatNum = (n: number) => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n.toString()
  return `${formatNum(min)} - ${formatNum(max)} ${currency}`
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ roleType: '', seniority: '', webType: '' })
  const [view, setView] = useState<'browse' | 'career' | 'applications' | 'company' | 'post' | 'myjobs' | 'sponsors'>('browse')
  const [myCompany, setMyCompany] = useState<any>(null)
  const [myJobs, setMyJobs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [careerProfile, setCareerProfile] = useState<any>(null)

  useEffect(() => { fetchJobs() }, [filters, search])
  useEffect(() => { if (view === 'company') fetchMyCompany() }, [view])
  useEffect(() => { if (view === 'applications') fetchApplications() }, [view])
  useEffect(() => { if (view === 'career') fetchCareerProfile() }, [view])
  useEffect(() => { if (view === 'myjobs') fetchMyJobs() }, [view])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filters.roleType) params.set('roleType', filters.roleType)
      if (filters.seniority) params.set('seniority', filters.seniority)
      if (filters.webType) params.set('webType', filters.webType)

      const [localRes, externalRes] = await Promise.all([
        fetch(`/api/jobs/board?${params}`),
        fetch('/api/jobs/external').catch(() => ({ json: () => ({ jobs: [] }) }))
      ])

      const localData = await localRes.json()
      const externalData = await externalRes.json()
      setJobs([...(localData.jobs || []), ...(externalData.jobs || [])])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyCompany = async () => {
    const res = await fetch('/api/jobs/companies')
    const data = await res.json()
    setMyCompany(data.companies?.[0] || null)
  }

  const fetchApplications = async () => {
    const res = await fetch('/api/jobs/apply')
    const data = await res.json()
    setApplications(data.applications || [])
  }

  const fetchCareerProfile = async () => {
    const res = await fetch('/api/jobs/career')
    const data = await res.json()
    setCareerProfile(data.profile || null)
  }

  const fetchMyJobs = async () => {
    const res = await fetch('/api/jobs/companies')
    const data = await res.json()
    const company = data.companies?.[0]
    if (company?.jobs) {
      setMyJobs(company.jobs)
    }
  }

  const handleApply = async (jobId: string) => {
    if (jobId.startsWith('gitcity-')) {
      alert('External jobs - apply on their website!')
      return
    }
    try {
      const res = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: jobId }),
      })
      if (res.ok) { alert('Applied!'); fetchJobs(); }
      else { const err = await res.json(); alert(err.error || 'Failed'); }
    } catch { alert('Failed to apply'); }
  }

  return (
    <DashboardShell>
      <DashboardHeader title="Jobs Board" icon={<Briefcase className="h-5 w-5 text-green-400" />} />
      <DashboardContent>
        {/* Beta Banner */}
        <div className="mb-4 p-3 bg-green-900/20 border border-green-800/50 rounded-lg flex items-center justify-between">
          <span className="text-green-400 text-xs font-bold uppercase tracking-widest">🎉 Jobs Board Beta</span>
          <a href="/sponsor" className="text-green-500 text-xs hover:underline">Support us →</a>
        </div>

        {/* Navigation - mobile responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
          <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto">
            <NavBtn active={view === 'browse'} onClick={() => setView('browse')}>Jobs</NavBtn>
            <NavBtn active={view === 'sponsors'} onClick={() => setView('sponsors')}>Sponsors</NavBtn>
            <NavBtn active={view === 'career'} onClick={() => setView('career')}>Career</NavBtn>
            <NavBtn active={view === 'applications'} onClick={() => setView('applications')}>Applications</NavBtn>
            {myCompany && <NavBtn active={view === 'myjobs'} onClick={() => setView('myjobs')}>My Jobs</NavBtn>}
            <NavBtn active={view === 'company'} onClick={() => setView('company')}>Company</NavBtn>
          </div>
          <button
            onClick={() => myCompany ? setView('post') : setView('company')}
            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase px-4 py-2 whitespace-nowrap"
          >
            {myCompany ? '+ Post Job' : '+ Post a Job'}
          </button>
        </div>

        {view === 'browse' && <BrowseJobs jobs={jobs} loading={loading} search={search} setSearch={setSearch} filters={filters} setFilters={setFilters} onApply={handleApply} />}
        {view === 'career' && <CareerForm profile={careerProfile} onSave={fetchCareerProfile} onCancel={() => setView('browse')} />}
        {view === 'applications' && <ApplicationsList applications={applications} />}
        {view === 'company' && <CompanyForm company={myCompany} onSave={fetchMyCompany} onCancel={() => setView('browse')} />}
        {view === 'post' && <PostJobForm company={myCompany} onCancel={() => setView('myjobs')} onPost={() => { fetchMyJobs(); setView('myjobs'); }} />}
        {view === 'myjobs' && <MyJobsList jobs={myJobs} onPostNew={() => setView('post')} />}
        {view === 'sponsors' && <SponsorsSection />}
      </DashboardContent>
    </DashboardShell>
  )
}

function NavBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${active ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
      {children}
    </button>
  )
}

function BrowseJobs({ jobs, loading, search, setSearch, filters, setFilters, onApply }: {
  jobs: Job[]; loading: boolean; search: string; setSearch: (s: string) => void;
  filters: { roleType: string; seniority: string; webType: string }; setFilters: React.Dispatch<React.SetStateAction<{ roleType: string; seniority: string; webType: string }>>;
  onApply: (id: string) => void
}) {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs..."
            className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-4 py-2 text-sm focus:border-green-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Select value={filters.roleType} onChange={(v) => setFilters({...filters, roleType: v})} options={ROLE_TYPES} placeholder="Role" />
          <Select value={filters.seniority} onChange={(v) => setFilters({...filters, seniority: v})} options={SENIORITY_LEVELS} placeholder="Level" />
          <Select value={filters.webType} onChange={(v) => setFilters({...filters, webType: v})} options={['web2', 'web3', 'both']} placeholder="Type" />
        </div>
      </div>

      {/* Results count and sort */}
      <div className="flex items-center justify-between mb-4 text-xs text-zinc-500">
        <span>{loading ? 'Loading...' : `${jobs.length} jobs`}</span>
        <select className="bg-zinc-900 border border-zinc-700 text-zinc-400 px-2 py-1">
          <option value="newest">Newest</option>
          <option value="salary">Highest Salary</option>
        </select>
      </div>

      {loading ? <div className="text-center py-12 text-zinc-500">Loading...</div> : jobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-800">
          <Briefcase className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-600">No jobs found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onApply={onApply} />
          ))}
        </div>
      )}
    </>
  )
}

function JobCard({ job, onApply }: { job: Job; onApply: (id: string) => void }) {
  const isExternal = job.source === 'gitcity'
  return (
    <div className="border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold">
          {job.company.name.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <h3 className="text-white font-bold">{job.title}</h3>
              <p className="text-zinc-400 text-sm flex items-center gap-1"><Building className="h-3 w-3" />{job.company.name}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold">{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</p>
              <p className="text-zinc-500 text-xs">{job.applyCount} applied</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Tag>{job.roleType}</Tag>
            <Tag>{job.seniority}</Tag>
            <Tag>{CONTRACT_TYPES[job.contractType] || job.contractType}</Tag>
            {isExternal && <Tag className="bg-blue-900/30 text-blue-400">Git City</Tag>}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => onApply(job.id)} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase px-4 py-2">
              {isExternal ? 'View' : 'Apply'}
            </button>
            <a href={job.applyUrl} target="_blank" rel="noopener" className="border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase px-4 py-2 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" /> Site
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`px-2 py-1 bg-zinc-800 text-zinc-400 text-xs ${className}`}>{children}</span>
}

function Select({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 py-2 text-sm"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

function CareerForm({ profile, onSave, onCancel }: { profile: any; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ skills: profile?.skills?.join(', ') || '', seniority: profile?.seniority || 'mid', yearsExperience: profile?.yearsExperience || 0, bio: profile?.bio || '', openToWork: profile?.openToWork || false })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/jobs/career', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean) }),
    })
    onSave()
    setSaving(false)
    alert('Saved!')
  }

  return (
    <div className="max-w-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <h3 className="text-white font-bold text-lg">Career Profile</h3>
      <div><label className="block text-zinc-400 text-sm mb-2">Bio</label><textarea value={form.bio} onChange={(e) => setForm({...form, bio: e.target.value})} rows={4} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-zinc-400 text-sm mb-2">Seniority</label><select value={form.seniority} onChange={(e) => setForm({...form, seniority: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2">{SENIORITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className="block text-zinc-400 text-sm mb-2">Years Experience</label><input type="number" value={form.yearsExperience} onChange={(e) => setForm({...form, yearsExperience: +e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      </div>
      <div><label className="block text-zinc-400 text-sm mb-2">Skills (comma separated)</label><input value={form.skills} onChange={(e) => setForm({...form, skills: e.target.value})} placeholder="React, TypeScript..." className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div className="flex items-center gap-2"><input type="checkbox" checked={form.openToWork} onChange={(e) => setForm({...form, openToWork: e.target.checked})} /><label className="text-zinc-400">Open to work</label></div>
      <div className="flex gap-4"><button onClick={onCancel} className="border border-zinc-700 text-zinc-400 px-4 py-2">Cancel</button><button onClick={handleSave} disabled={saving} className="bg-green-600 px-4 py-2">{saving ? 'Saving...' : 'Save'}</button></div>
    </div>
  )
}

function ApplicationsList({ applications }: { applications: any[] }) {
  if (!applications.length) return <div className="text-center py-12 text-zinc-500">No applications yet</div>
  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div key={app.id} className="border border-zinc-800 bg-zinc-900/50 p-4 flex justify-between">
          <div><h4 className="text-white font-bold">{app.listing?.title}</h4><p className="text-zinc-400 text-sm">{app.listing?.company?.name}</p></div>
          <div className="text-right text-xs text-zinc-500">{new Date(app.createdAt).toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  )
}

function CompanyForm({ company, onSave, onCancel }: { company: any; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: company?.name || '', website: company?.website || '', description: company?.description || '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.website) return alert('Name and website required')
    setSaving(true)
    await fetch('/api/jobs/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'company', ...form, slug: form.name.toLowerCase().replace(/[^a-z0-9-]/g, '-') }),
    })
    onSave()
    setSaving(false)
    alert('Company saved!')
  }

  return (
    <div className="max-w-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <h3 className="text-white font-bold text-lg">{company ? 'My Company' : 'Create Company'}</h3>
      <div><label className="block text-zinc-400 text-sm mb-2">Name</label><input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div><label className="block text-zinc-400 text-sm mb-2">Website</label><input value={form.website} onChange={(e) => setForm({...form, website: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div><label className="block text-zinc-400 text-sm mb-2">Description</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div className="flex gap-4"><button onClick={onCancel} className="border border-zinc-700 text-zinc-400 px-4 py-2">Cancel</button><button onClick={handleSave} disabled={saving} className="bg-green-600 px-4 py-2">{saving ? 'Saving...' : 'Save'}</button></div>
    </div>
  )
}

function PostJobForm({ company, onCancel, onPost }: { company: any; onCancel: () => void; onPost?: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', salaryMin: 50000, salaryMax: 150000, roleType: 'backend', seniority: 'mid', contractType: 'clt', techStack: '', applyUrl: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.applyUrl) return alert('Fill required fields')
    setSaving(true)
    await fetch('/api/jobs/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: company.id, ...form, techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean) }),
    })
    setSaving(false)
    alert('Job posted!')
    onCancel()
  }

  return (
    <div className="max-w-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
      <h3 className="text-white font-bold text-lg">Post a Job for {company.name}</h3>
      <div><label className="block text-zinc-400 text-sm mb-2">Title</label><input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div><label className="block text-zinc-400 text-sm mb-2">Description</label><textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} rows={4} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="block text-zinc-400 text-sm mb-2">Salary Min</label><input type="number" value={form.salaryMin} onChange={(e) => setForm({...form, salaryMin: +e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
        <div><label className="block text-zinc-400 text-sm mb-2">Salary Max</label><input type="number" value={form.salaryMax} onChange={(e) => setForm({...form, salaryMax: +e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-zinc-400 text-sm mb-2">Role</label><select value={form.roleType} onChange={(e) => setForm({...form, roleType: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2">{ROLE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
        <div><label className="block text-zinc-400 text-sm mb-2">Level</label><select value={form.seniority} onChange={(e) => setForm({...form, seniority: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2">{SENIORITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
        <div><label className="block text-zinc-400 text-sm mb-2">Contract</label><select value={form.contractType} onChange={(e) => setForm({...form, contractType: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2"><option value="clt">Full-time</option><option value="pj">Contractor</option></select></div>
      </div>
      <div><label className="block text-zinc-400 text-sm mb-2">Tech Stack</label><input value={form.techStack} onChange={(e) => setForm({...form, techStack: e.target.value})} placeholder="React, TypeScript..." className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div><label className="block text-zinc-400 text-sm mb-2">Apply URL</label><input value={form.applyUrl} onChange={(e) => setForm({...form, applyUrl: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2" /></div>
      <div className="flex gap-4"><button onClick={onCancel} className="border border-zinc-700 text-zinc-400 px-4 py-2">Cancel</button><button onClick={handleSubmit} disabled={saving} className="bg-green-600 px-4 py-2">{saving ? 'Posting...' : 'Post Job'}</button></div>
    </div>
  )
}

function MyJobsList({ jobs, onPostNew }: { jobs: any[]; onPostNew: () => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-lg">My Posted Jobs</h3>
        <button onClick={onPostNew} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase px-4 py-2">
          + Post New Job
        </button>
      </div>
      {!jobs.length ? (
        <div className="text-center py-12 border border-dashed border-zinc-800">
          <Briefcase className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-600">No jobs posted yet</p>
          <button onClick={onPostNew} className="mt-4 text-green-400 text-sm">Post your first job →</button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border border-zinc-800 bg-zinc-900/50 p-4 flex justify-between items-center">
              <div>
                <h4 className="text-white font-bold">{job.title}</h4>
                <p className="text-zinc-400 text-sm">{job.viewCount} views • {job.applyCount} applications</p>
              </div>
              <span className={`px-2 py-1 text-xs ${job.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {job.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SponsorsSection() {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/jobs/sponsors')
      .then(res => res.json())
      .then(data => setSponsors(data.sponsors || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Agentbot Sponsorship Banner */}
      <div className="border border-blue-800 bg-gradient-to-r from-blue-900/30 to-green-900/30 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Support Agentbot</h3>
            <p className="text-zinc-400 text-sm mt-1">Help us build the future of AI agents. Your sponsorship keeps us running and enables us to expand our services.</p>
            <p className="text-zinc-500 text-xs mt-2">Monthly goal: $500 to cover infrastructure costs</p>
          </div>
          <a
            href="https://github.com/sponsors/Eskyee"
            target="_blank"
            rel="noopener"
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase px-6 py-3 transition-colors"
          >
            Sponsor on GitHub
          </a>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-white font-bold text-lg">Sponsors & Backers</h3>
          <p className="text-zinc-400 text-sm">Companies supporting open source developers</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase px-4 py-2">
          + Become a Sponsor
        </button>
      </div>

      {showForm && (
        <div className="max-w-2xl border border-green-800 bg-green-900/20 p-6 mb-6">
          <h4 className="text-white font-bold mb-4">Become a Sponsor</h4>
          <p className="text-zinc-400 text-sm mb-4">Support open source projects and developers. Get visibility on the jobs board.</p>
          <a href="https://www.thegitcity.com/hire/Eskyee" target="_blank" rel="noopener" className="text-green-400 text-sm hover:underline">
            Learn about sponsorship → 
          </a>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading sponsors...</div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-800">
          <p className="text-zinc-600">No sponsors yet. Be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((sponsor) => (
            <div key={sponsor.id} className="border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-zinc-800 flex items-center justify-center text-white font-bold">
                  {sponsor.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-white font-bold">{sponsor.name}</h4>
                  <a href={sponsor.website} target="_blank" rel="noopener" className="text-green-400 text-xs hover:underline">
                    Visit →
                  </a>
                </div>
              </div>
              {sponsor.description && <p className="text-zinc-400 text-xs mt-2">{sponsor.description.slice(0,100)}</p>}
              {sponsor.hiredCount > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <span className="text-green-400 text-xs font-bold">{sponsor.hiredCount} developers hired</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}