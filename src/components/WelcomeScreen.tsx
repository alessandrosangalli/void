import { loginToDrive } from '../drive'
import { useSetAtom } from 'jotai'
import { isAuthenticatedAtom, explorerStateAtom } from '../store'

export function WelcomeScreen() {
  const setIsAuth = useSetAtom(isAuthenticatedAtom)
  const setExplorer = useSetAtom(explorerStateAtom)

  const handleConnect = () => {
    loginToDrive(() => {
      setIsAuth(true)
      // Auto-open explorer after login to "sync" with drive state
      setExplorer({ isOpen: true, mode: 'load' })
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: '#000', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '20px', textAlign: 'center'
    }}>
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px'
      }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" strokeOpacity="0.2" />
        </svg>
      </div>

      <h1 style={{ fontSize: '48px', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-2px' }}>Void</h1>

      <button
        onClick={handleConnect}
        style={{
          background: '#fff', color: '#000', border: 'none', padding: '16px 32px',
          borderRadius: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer',
          transition: 'all 0.2s', boxShadow: '0 10px 30px rgba(255,255,255,0.1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Conectar Google Drive
      </button>

      <div style={{ position: 'absolute', bottom: '40px', fontSize: '12px', color: '#444' }}>
        O Void utiliza o escopo restrito do Google Drive para garantir total privacidade dos seus dados.
      </div>
    </div>
  )
}
