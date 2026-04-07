'use client'

import { useState, useEffect } from 'react'
import { Briefcase, Search, MapPin, DollarSign, Clock, ExternalLink, Building, User, Bell } from 'lucide-react'
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
    description: string | null
  }
}

const ROLE_TYPES = ['frontend', 'backend', 'fullstack', 'devops', 'mobile', 'data', 'design', 'other']
const SENIORITY_LEVELS = ['junior', 'mid', 'senior', 'staff', 'lead']
const CONTRACT_TYPES = { clt: 'Full-time (CLT)', pj: 'Contractor (PJ)', contract: 'Contract' }
const WEB_TYPES = { web2: 'Web2', web3: 'Web3', both: 'Web2 + Web3' }

const formatSalary = (min: number, max: number, currency: string) => {
  const formatNum = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
    return n.toString()
  }
  return `${formatNum(min)} - ${formatNum(max)} ${currency}`
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    roleType: '',
    seniority: '',
    webType: '',
  })
  const [view, setView] = useState<'browse' | 'career' | 'applications' | 'post' | 'company'>('browse')
  const [myCompany, setMyCompany] = useState<any>(null)
  const [loadingCompany, setLoadingCompany] = useState(true)

  useEffect(() => {
    fetchJobs()
    fetchMyCompany()
  }, [filters, search])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filters.roleType) params.set('roleType', filters.roleType)
      if (filters.seniority) params.set('seniority', filters.seniority)
      if (filters.webType) params.set('webType', filters.webType)

      const response = await fetch(`/api/jobs/board?${params}`)
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyCompany = async () => {
    try {
      const response = await fetch('/api/jobs/companies')
      const data = await response.json()
      setMyCompany(data.companies?.[0] || null)
    } catch (error) {
      console.error('Failed to fetch company:', error)
    } finally {
      setLoadingCompany(false)
    }
  }

  const handleApply = async (jobId: string) => {
    try {
      const response = await fetch('/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: jobId }),
      })
      
      if (response.ok) {
        alert('Applied successfully!')
        fetchJobs()
      } else {
        const err = await response.json()
        alert(err.error || 'Failed to apply')
      }
    } catch (error) {
      alert('Failed to apply')
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        title="Jobs Board"
        icon={<Briefcase className="h-5 w-5 text-green-400" />}
      />

      <DashboardContent>
        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <div className="flex gap-4">
            <button
              onClick={() => setView('browse')}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                view === 'browse' ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Browse Jobs
            </button>
            <button
              onClick={() => setView('career')}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                view === 'career' ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              My Career Profile
            </button>
            <button
              onClick={() => setView('applications')}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                view === 'applications' ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              My Applications
            </button>
            <button
              onClick={() => setView('company')}
              className={`px-4 py-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                view === 'company' ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              My Company
            </button>
          </div>
          <div className="flex gap-2">
            <a
              href="https://www.thegitcity.com/jobs"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors"
            >
              Git City Jobs ↗
            </a>
            <button
              onClick={() => myCompany ? setView('post') : setView('company')}
              className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors"
            >
              {myCompany ? '+ Post Job' : '+ Post a Job'}
            </button>
          </div>
        </div>

        {view === 'browse' && (
          <>
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search jobs, companies, tech..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white pl-10 pr-4 py-2 text-sm focus:border-green-500 focus:outline-none"
                />
              </div>
              <select
                value={filters.roleType}
                onChange={(e) => setFilters({ ...filters, roleType: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">All Roles</option>
                {ROLE_TYPES.map((role) => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
              <select
                value={filters.seniority}
                onChange={(e) => setFilters({ ...filters, seniority: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">All Levels</option>
                {SENIORITY_LEVELS.map((level) => (
                  <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                ))}
              </select>
              <select
                value={filters.webType}
                onChange={(e) => setFilters({ ...filters, webType: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 text-zinc-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                <option value="">All Types</option>
                {Object.entries(WEB_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-zinc-500">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-800">
                <Briefcase className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-600 text-sm">No jobs found</p>
                <p className="text-zinc-700 text-xs mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-lg">
                        {job.company.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-bold text-lg">{job.title}</h3>
                            <p className="text-zinc-400 text-sm flex items-center gap-2">
                              <Building className="h-3 w-3" />
                              {job.company.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-400 font-bold">
                              {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
                            </p>
                            <p className="text-zinc-500 text-xs flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              {job.applyCount} applied
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs">
                            {job.roleType}
                          </span>
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs">
                            {job.seniority}
                          </span>
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs">
                            {CONTRACT_TYPES[job.contractType as keyof typeof CONTRACT_TYPES] || job.contractType}
                          </span>
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs">
                            {WEB_TYPES[job.webType as keyof typeof WEB_TYPES] || job.webType}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-2">
                          {job.techStack.slice(0, 6).map((tech) => (
                            <span key={tech} className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleApply(job.id)}
                            className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors"
                          >
                            Apply Now
                          </button>
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors flex items-center gap-2"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Company Site
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === 'career' && (
          <CareerProfileForm />
        )}

        {view === 'applications' && (
          <ApplicationsList />
        )}

        {view === 'company' && (
          <CompanyForm company={myCompany} onUpdate={fetchMyCompany} onCancel={() => setView('browse')} />
        )}

        {view === 'post' && (
          <PostJobForm company={myCompany} onCancel={() => setView('browse')} />
        )}
      </DashboardContent>
    </DashboardShell>
  )
}

function CareerProfileForm() {
  const [profile, setProfile] = useState({
    skills: [] as string[],
    seniority: 'mid',
    yearsExperience: 0,
    bio: '',
    webType: 'both',
    contractTypes: [] as string[],
    salaryMin: 0,
    salaryMax: 0,
    openToWork: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/jobs/career')
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile({
            skills: data.profile.skills || [],
            seniority: data.profile.seniority || 'mid',
            yearsExperience: data.profile.yearsExperience || 0,
            bio: data.profile.bio || '',
            webType: data.profile.webType || 'both',
            contractTypes: data.profile.contractTypes || [],
            salaryMin: data.profile.salaryMin || 0,
            salaryMax: data.profile.salaryMax || 0,
            openToWork: data.profile.openToWork || false,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/jobs/career', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      
      if (response.ok) {
        alert('Profile saved!')
      }
    } catch (error) {
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading profile...</div>

  return (
    <div className="max-w-2xl">
      <div className="border border-zinc-800 bg-zinc-900/50 p-6 space-y-6">
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="Tell us about yourself..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Seniority</label>
            <select
              value={profile.seniority}
              onChange={(e) => setProfile({ ...profile, seniority: e.target.value })}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {SENIORITY_LEVELS.map((level) => (
                <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Years Experience</label>
            <input
              type="number"
              value={profile.yearsExperience}
              onChange={(e) => setProfile({ ...profile, yearsExperience: parseInt(e.target.value) || 0 })}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-zinc-400 text-sm mb-2">Skills (comma separated)</label>
          <input
            type="text"
            value={profile.skills.join(', ')}
            onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="React, TypeScript, Node.js, ..."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="openToWork"
            checked={profile.openToWork}
            onChange={(e) => setProfile({ ...profile, openToWork: e.target.checked })}
            className="bg-zinc-900 border border-zinc-700"
          />
          <label htmlFor="openToWork" className="text-zinc-400 text-sm">
            Open to work
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest px-6 py-2 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}

function ApplicationsList() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/jobs/apply')
      .then((res) => res.json())
      .then((data) => setApplications(data.applications || []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading applications...</div>

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-zinc-800">
        <Briefcase className="h-8 w-8 text-zinc-700 mx-auto mb-3" />
        <p className="text-zinc-600 text-sm">No applications yet</p>
        <p className="text-zinc-700 text-xs mt-1">Browse jobs and apply to see them here</p>
    </div>
  )
}

function PostJobForm({ company, onCancel }: { company: any; onCancel: () => void }) {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [salaryMin, setSalaryMin] = useState(50000)
  const [salaryMax, setSalaryMax] = useState(150000)
  const [roleType, setRoleType] = useState('backend')
  const [seniority, setSeniority] = useState('mid')
  const [contractType, setContractType] = useState('clt')
  const [techStack, setTechStack] = useState('')
  const [applyUrl, setApplyUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const handlePostJob = async () => {
    if (!company?.id) return
    setSaving(true)
    try {
      const response = await fetch('/api/jobs/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: company.id,
          title: jobTitle,
          description: jobDescription,
          salaryMin,
          salaryMax,
          roleType,
          seniority,
          contractType,
          techStack: techStack.split(',').map((s) => s.trim()).filter(Boolean),
          applyUrl,
        }),
      })
      const data = await response.json()
      if (data.job) {
        alert('Job posted! It will be visible once approved.')
        onCancel()
      } else {
        alert(data.error || 'Failed to post job')
      }
    } catch (error) {
      alert('Failed to post job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h3 className="text-white font-bold text-lg mb-4">Post a Job for {company?.name}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Job Title</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="Senior Backend Engineer"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Description</label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={4}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="Describe the role, responsibilities, and ideal candidate..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Salary Min ($)</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Salary Max ($)</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Role Type</label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {ROLE_TYPES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Seniority</label>
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {SENIORITY_LEVELS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Contract</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="clt">Full-time (CLT)</option>
              <option value="pj">Contractor (PJ)</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Tech Stack (comma separated)</label>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="React, TypeScript, Node.js, PostgreSQL"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Apply URL</label>
          <input
            type="url"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="https://acme.com/careers/..."
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePostJob}
            disabled={saving || !jobTitle || !jobDescription || !applyUrl}
            className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors"
          >
            {saving ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </div>
    </div>
  )
}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Salary Min ($)</label>
            <input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Salary Max ($)</label>
            <input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(parseInt(e.target.value) || 0)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Role Type</label>
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {ROLE_TYPES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Seniority</label>
            <select
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              {SENIORITY_LEVELS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Contract</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            >
              <option value="clt">Full-time (CLT)</option>
              <option value="pj">Contractor (PJ)</option>
              <option value="contract">Contract</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Tech Stack (comma separated)</label>
          <input
            type="text"
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="React, TypeScript, Node.js, PostgreSQL"
          />
        </div>
        <div>
          <label className="block text-zinc-400 text-sm mb-2">Apply URL</label>
          <input
            type="url"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 text-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
            placeholder="https://acme.com/careers/..."
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePostJob}
            disabled={saving || !jobTitle || !jobDescription || !applyUrl}
            className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors"
          >
            {saving ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="border border-zinc-800 bg-zinc-900/50 p-4 flex items-center justify-between"
        >
          <div>
            <h4 className="text-white font-bold">{app.listing?.title}</h4>
            <p className="text-zinc-400 text-sm">{app.listing?.company?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-xs">
              Applied {new Date(app.createdAt).toLocaleDateString()}
            </p>
            <p className={`text-xs ${app.hasProfile ? 'text-green-400' : 'text-yellow-400'}`}>
              {app.hasProfile ? 'Profile included' : 'No profile'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}