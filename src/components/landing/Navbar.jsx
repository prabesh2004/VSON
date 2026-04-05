import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Eye, Menu, X } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Technology', href: '#technology' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export const Navbar = () => {
  const navigate = useNavigate()
  const prefersReduced = useReducedMotion()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogin = () => navigate(ROUTES.DESCRIBE)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-[#0B121B]/90 backdrop-blur-md border-b border-[#2F3C4C]"
      role="banner"
    >
      <nav
        className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between"
        aria-label="Main navigation"
      >
        <motion.a
          href="#"
          className="flex items-center gap-3 sm:gap-4 group focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B] rounded-sm"
          aria-label="Vision — home"
          initial={prefersReduced ? {} : { opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Eye className="w-7 h-7 text-[#A9D1F5] shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span className="hidden sm:block h-7 w-px shrink-0 bg-[#2F3C4C]" aria-hidden="true" />
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-[#E9EEF4] text-lg tracking-wide leading-none">VISION</span>
            <span className="hidden sm:block text-[#7A8B9B] font-body text-[11px] leading-snug max-w-[188px]">
              Enhancing Independence
              <br />
              through Persistent Sight
            </span>
          </div>
        </motion.a>

        <motion.ul
          className="hidden md:flex items-center gap-8"
          role="list"
          initial={prefersReduced ? {} : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                className="font-body text-sm text-[#E9EEF4]/90 hover:text-[#E9EEF4] transition-colors focus-visible:ring-2 focus-visible:ring-[#A9D1F5] rounded-sm"
              >
                {label}
              </a>
            </li>
          ))}
        </motion.ul>

        <motion.div
          className="flex items-center gap-3"
          initial={prefersReduced ? {} : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.12 }}
        >
          <button
            type="button"
            onClick={handleLogin}
            className="hidden md:inline-flex font-body text-sm text-[#E9EEF4] bg-[#161F2C] border border-[#2F3C4C] hover:bg-[#1c2838] px-4 py-2 rounded-lg transition-colors min-h-touch min-w-touch items-center justify-center focus-visible:ring-2 focus-visible:ring-[#A9D1F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B121B]"
            aria-label="Login to Vision app"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden text-[#7A8B9B] hover:text-[#E9EEF4] p-2 rounded-lg focus-visible:ring-2 focus-visible:ring-[#A9D1F5] min-w-touch min-h-touch flex items-center justify-center"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </motion.div>
      </nav>

      {menuOpen && (
        <motion.div
          className="md:hidden bg-[#0B121B] border-t border-[#2F3C4C] px-4 sm:px-6 py-4 flex flex-col gap-3"
          initial={prefersReduced ? {} : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          role="menu"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="font-body text-sm text-[#E9EEF4]/90 py-2"
              role="menuitem"
            >
              {label}
            </a>
          ))}
          <button
            type="button"
            onClick={handleLogin}
            className="font-body text-sm text-[#E9EEF4] bg-[#161F2C] border border-[#2F3C4C] px-4 py-3 rounded-lg text-left min-h-touch"
            aria-label="Login to Vision app"
          >
            Login
          </button>
        </motion.div>
      )}
    </header>
  )
}
