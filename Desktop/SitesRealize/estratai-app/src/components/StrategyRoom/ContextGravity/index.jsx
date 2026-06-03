import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../../../supabaseClient';

// Importação dos Módulos Fatiados
import GravityHeader from './GravityHeader';
import GravityArena from './GravityArena';
import NodeConfigModal from './modals/NodeConfigModal';
import FileExplorerModal from './modals/FileExplorerModal';

export default function ContextGravity({ projectId }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    fetchProjectFiles();
  }, [projectId]);

  const fetchProjectFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_files')
        .select(`
          file_id,
          weight,
          x,
          y,
          intent,
          custom_icon,
          custom_color,
          tag_weight,
          vault_items ( id, name, type, size )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      
      const mapped = (data || [])
        .filter(item => item.vault_items)
        .map((item, index) => {
          let nodeX = item.x ?? 0;
          let nodeY = item.y ?? 0;
          
          if (nodeX === 0 && nodeY === 0) {
            const angle = (index / data.length) * 2 * Math.PI;
            const radius = 220; // Snap inicial no anel do meio para manter organização
            nodeX = Math.cos(angle) * radius;
            nodeY = Math.sin(angle) * radius;
          }
          
          return {
            id: item.file_id,
            name: item.vault_items.name,
            type: item.vault_items.type,
            size: item.vault_items.size,
            x: nodeX,
            y: nodeY,
            weight: item.weight ?? 1,
            intent: item.intent || 'neutral',
            customIcon: item.custom_icon || null,
            customColor: item.custom_color || null,
            tag: item.tag_weight || 'base'
          };
        });

      setFiles(mapped);
    } catch (err) {
      console.error("❌ Erro ao sincronizar malha gravitacional:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (fileId, newX, newY) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, x: newX, y: newY } : f));

    const { error } = await supabase
      .from('project_files')
      .update({ x: newX, y: newY })
      .eq('project_id', projectId)
      .eq('file_id', fileId);

    if (error) console.error("❌ Erro ao persistir coordenadas:", error.message);
  };

  const handleSaveNodeConfig = async (fileId, updatedConfig) => {
    try {
      const { error } = await supabase
        .from('project_files')
        .update({
          weight: parseInt(updatedConfig.weight) || 1,
          intent: updatedConfig.intent,
          custom_icon: updatedConfig.customIcon || null,
          custom_color: updatedConfig.customColor || null
        })
        .eq('project_id', projectId)
        .eq('file_id', fileId);

      if (error) throw error;

      setEditingFile(null);
      fetchProjectFiles(); 
    } catch (err) {
      console.error("❌ Erro ao salvar configurações:", err.message);
    }
  };

  const unlinkFile = async (fileId) => {
    try {
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('project_id', projectId)
        .eq('file_id', fileId);

      if (error) throw error;
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (err) {
      console.error("❌ Erro ao desvincular:", err.message);
    }
  };

  const handleLinkFile = async (fileId) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { error } = await supabase
        .from('project_files')
        .insert([{
          project_id: projectId,
          file_id: fileId,
          tag_weight: 'base',
          weight: 1,
          x: 0,
          y: 0,
          intent: 'neutral',
          custom_icon: null,
          custom_color: null,
          user_id: authData.user.id
        }]);

      if (error) throw error;
      
      setShowLinkModal(false);
      fetchProjectFiles();
    } catch (err) {
      console.error("❌ Erro ao injetar arquivo:", err.message);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-[600px] flex items-center justify-center border border-[#262626] bg-[#0A0A0A]">
        <Loader2 className="text-[var(--color-plan)] animate-spin" size={24} />
        <span className="font-mono text-xs uppercase tracking-widest text-[#737373] ml-3">Carregando Matriz Espacial...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full min-h-[700px] bg-[#0A0A0A] border border-[#262626] overflow-hidden relative">
      <GravityHeader
        onOpenLinkModal={() => setShowLinkModal(true)}
        onRefresh={fetchProjectFiles}
        filesCount={files.length}
      />

      <GravityArena
        files={files}
        onDragEnd={handleDragEnd}
        onEditNode={(id) => setEditingFile({ ...files.find(f => f.id === id) })}
        onUnlinkNode={unlinkFile}
      />

      <AnimatePresence>
        {editingFile && (
          <NodeConfigModal
            file={editingFile}
            onChange={(updated) => setEditingFile(updated)}
            onClose={() => setEditingFile(null)}
            onSave={(config) => handleSaveNodeConfig(editingFile.id, config)}
          />
        )}
        
        {showLinkModal && (
          <FileExplorerModal 
            projectId={projectId} 
            onClose={() => setShowLinkModal(false)} 
            onLinkFile={handleLinkFile}
            linkedFileIds={files.map(f => f.id)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}