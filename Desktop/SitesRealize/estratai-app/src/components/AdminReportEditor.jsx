import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import EditorTab from './StrategyRoom/EditorTab';

const ADMIN_ID = import.meta.env.VITE_ADMIN_USER_ID;

export default function AdminReportEditor() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'error'

  useEffect(() => {
    async function load() {
      if (!ADMIN_ID) {
        console.error('[AdminReportEditor] VITE_ADMIN_USER_ID não está configurado no .env');
        navigate('/');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user || user.id !== ADMIN_ID) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('id', projectId)
        .single();

      if (error || !data) {
        setStatus('error');
      } else {
        setProject(data);
        setStatus('ok');
      }
    }

    load();
  }, [projectId, navigate]);

  if (status === 'loading') return <p style={{ padding: 24 }}>Carregando...</p>;
  if (status === 'error')   return <p style={{ padding: 24 }}>Projeto não encontrado.</p>;

  return (
    <div style={{ padding: 24 }}>
      <EditorTab project={project} />
    </div>
  );
}
