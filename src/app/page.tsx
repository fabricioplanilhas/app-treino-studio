import Link from 'next/link';
import { Dumbbell, LayoutDashboard, ClipboardEdit, ClipboardCheck } from 'lucide-react';

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem 1rem',
      gap: '1.5rem',
      textAlign: 'center'
    }}>
      {/* Logo Responsiva (TV, Tablet, Mobile) */}
      <img
        src="/logo.jpg"
        alt="Logo"
        style={{
          width: '100%',
          maxWidth: '360px',
          height: 'auto',
          maxHeight: '200px',
          objectFit: 'contain',
          marginBottom: '0.5rem',
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))'
        }}
      />

      {/* Título Atualizado */}
      <h1 style={{
        fontSize: 'clamp(1.75rem, 4vw, 2.8rem)',
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: 'var(--text-primary)',
        margin: 0
      }}>
        Gerenciador de Treinos
      </h1>

      {/* Grid de Botões Responsivos */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1rem',
        marginTop: '1.5rem',
        maxWidth: '900px',
        width: '100%'
      }}>
        <Link
          href="/admin"
          className="premium-btn"
          style={{
            padding: '16px 24px',
            fontSize: '1.1rem',
            flex: '1 1 220px',
            maxWidth: '280px',
            justifyContent: 'center'
          }}
        >
          <LayoutDashboard size={24} />
          Painel do Professor
        </Link>
        <Link
          href="/treinos"
          className="premium-btn"
          style={{
            padding: '16px 24px',
            fontSize: '1.1rem',
            background: '#3b82f6',
            flex: '1 1 220px',
            maxWidth: '280px',
            justifyContent: 'center'
          }}
        >
          <ClipboardEdit size={24} />
          Criar e Editar Treinos
        </Link>
        <Link
          href="/tv"
          className="premium-btn-outline"
          style={{
            padding: '16px 24px',
            fontSize: '1.1rem',
            flex: '1 1 220px',
            maxWidth: '280px',
            justifyContent: 'center'
          }}
        >
          <Dumbbell size={24} color="#ef4444" />
          Tela da TV
        </Link>
        <Link
          href="/primeira-aula"
          className="premium-btn"
          style={{
            padding: '16px 24px',
            fontSize: '1.1rem',
            background: '#10b981',
            flex: '1 1 220px',
            maxWidth: '280px',
            justifyContent: 'center'
          }}
        >
          <ClipboardCheck size={24} />
          Primeira Aula
        </Link>
      </div>
    </div>
  );
}

