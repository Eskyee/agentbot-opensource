import { NextResponse } from 'next/server'

const GIT_CITY_JOBS_URL = 'https://www.thegitcity.com/api/jobs'

export async function GET() {
  try {
    const response = await fetch(GIT_CITY_JOBS_URL, {
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`Git City API error: ${response.status}`)
    }

    const data = await response.json()
    
    const jobs = (data.listings || []).map((job: any) => ({
      id: `gitcity-${job.id}`,
      title: job.title,
      description: job.description?.replace(/<[^>]*>/g, '').slice(0, 500),
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      salaryCurrency: job.salary_currency,
      roleType: job.role_type,
      techStack: job.tech_stack || [],
      seniority: job.seniority,
      contractType: job.contract_type === 'fulltime' ? 'clt' : job.contract_type,
      webType: job.web_type,
      applyUrl: job.apply_url,
      status: job.status,
      viewCount: job.view_count || 0,
      applyCount: job.apply_count || 0,
      publishedAt: job.published_at,
      company: {
        name: job.company?.name || 'Unknown Company',
        slug: job.company?.slug || 'unknown',
        logoUrl: job.company?.logo_url,
        website: job.company?.website || 'https://www.thegitcity.com',
      },
      source: 'gitcity',
    }))

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('Failed to fetch Git City jobs:', error)
    return NextResponse.json({ jobs: [], error: 'Failed to fetch external jobs' }, { status: 500 })
  }
}