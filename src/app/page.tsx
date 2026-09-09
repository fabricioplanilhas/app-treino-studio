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
      {/* Logo Responsiva e Vazada / Transparente */}
      <img
        src="/logo.png"
        alt="Logo"
        style={{
          width: '100%',
          maxWidth: '340px',
          height: 'auto',
          maxHeight: '180px',
          objectFit: 'contain',
          marginBottom: '0.5rem',
          mixBlendMode: 'multiply'
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

      {/* Grid com os 4 Blocos Lado a Lado na Horizontal */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem',
        marginTop: '1.5rem',
        maxWidth: '1150px',
        width: '100%'
      }}>
        <Link
          href="/admin"
          className="premium-btn"
          style={{
            padding: '16px 20px',
            fontSize: '1.05rem',
            flex: '1 1 200px',
            maxWidth: '250px',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          <LayoutDashboard size={22} />
          Painel do Professor
        </Link>
        <Link
          href="/treinos"
          className="premium-btn"
          style={{
            padding: '16px 20px',
            fontSize: '1.05rem',
            background: '#3b82f6',
            flex: '1 1 200px',
            maxWidth: '250px',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          <ClipboardEdit size={22} />
          Criar e Editar Treinos
        </Link>
        <Link
          href="/tv"
          className="premium-btn-outline"
          style={{
            padding: '16px 20px',
            fontSize: '1.05rem',
            flex: '1 1 200px',
            maxWidth: '250px',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          <Dumbbell size={22} color="#ef4444" />
          Tela da TV
        </Link>
        <Link
          href="/primeira-aula"
          className="premium-btn"
          style={{
            padding: '16px 20px',
            fontSize: '1.05rem',
            background: '#10b981',
            flex: '1 1 200px',
            maxWidth: '250px',
            justifyContent: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          <ClipboardCheck size={22} />
          Primeira Aula
        </Link>
      </div>
    </div>
  );
}


