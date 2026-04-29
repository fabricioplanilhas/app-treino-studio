import Link from 'next/link';
import { Dumbbell, LayoutDashboard, ClipboardEdit } from 'lucide-react';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
        Rumpel Training - Gerenciador de Treinos
      </h1>
      <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2rem' }}>
        <Link href="/admin" className="premium-btn" style={{ padding: '16px 24px', fontSize: '1.1rem' }}>
          <LayoutDashboard size={24} />
          Painel do Professor
        </Link>
        <Link href="/treinos" className="premium-btn" style={{ padding: '16px 24px', fontSize: '1.1rem', background: '#3b82f6' }}>
          <ClipboardEdit size={24} />
          Criar e Editar Treinos
        </Link>
        <Link href="/tv" className="premium-btn-outline" style={{ padding: '16px 24px', fontSize: '1.1rem' }}>
          <Dumbbell size={24} />
          Tela da TV (1080p)
        </Link>
      </div>
    </div>
  );
}
