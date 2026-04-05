import { Navbar } from '@/components/landing/Navbar'
import { LandingHero } from '@/components/landing/LandingHero'

export const Home = () => {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-[#A9D1F5] text-[#0B121B] px-4 py-2 rounded-lg z-[60] font-body text-sm font-medium"
      >
        Skip to main content
      </a>

      <div className="min-h-dvh bg-[#0B121B]">
        <Navbar />
        <main id="main-content" tabIndex={-1} aria-label="Vision landing page">
          <LandingHero />
        </main>
      </div>
    </>
  )
}
