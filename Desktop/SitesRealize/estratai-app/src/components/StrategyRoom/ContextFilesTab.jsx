import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Database, Plus, X, GripVertical, ThumbsUp, ThumbsDown, Loader2, Search } from 'lucide-react';

export default function ContextFilesTab({ projectId }) {
  const [projectFiles, setProjectFiles] = useState([]);
  const [availableVaultFiles, setAvailableVaultFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Busca todas os arquivos com suas métricas espaciais e customizações desta consultoria
      const { data: linkedData, error: linkedError } = await supabase
        .from('project_files')
        .select(`
          file_id, 
          tag_weight, 
          weight, 
          x, 
          y, 
          intent, 
          custom_icon, 
          custom_color, 
          vault_items ( id, name, type )
        `)
        .eq('project_id', projectId);

      if (linkedError) throw linkedError;

      const linked = linkedData ? linkedData
        .filter(item => item.vault_items) 
        .map(item => ({
          id: item.vault_items.id,
          name: item.vault_items.name,
          type: item.vault_items.type,
          tag: item.tag_weight || 'base',
          weight: item.weight ?? 1,
          x: item.x ?? 0,
          y: item.y ?? 0,
          intent: item.intent || 'neutral',
          customIcon: item.custom_icon || null,
          customColor: item.custom_color || null
        })) : [];
      
      setProjectFiles(linked);

      // 2. Coleta arquivos globais do repositório para o menu de injeção
      const { data: vaultData, error: vaultError } = await supabase
        .from('vault_items')
        .select('*')
        .neq('type', 'folder'); 

      if (vaultError) throw vaultError;
      setAvailableVaultFiles(vaultData || []);

    } catch (error) {
      console.error("❌ Erro ao carregar dados do contexto:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ATTACH: Inicia o arquivo no projeto aplicando todos os novos padrões estruturais de dados
  const handleAttachFile = async (fileId) => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const jáExiste = projectFiles.some(f => f.id === fileId);
      if (jáExiste) {
        setShowAddMenu(false);
        return;
      }

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
          custom_icon: null,  // Pode ser modificado dinamicamente depois
          custom_color: null, // Pode ser modificado dinamicamente depois
          user_id: authData.user.id
        }]);

      if (error) throw error;
      
      setShowAddMenu(false);
      fetchData();
    } catch (error) {
      console.error("❌ Erro ao vincular arquivo:", error.message);
    }
  };

  const handleUpdateFileTag = async (fileId, newTag) => {
    try {
      const { error } = await supabase
        .from('project_files')
        .update({ tag_weight: newTag })
        .eq('project_id', projectId)
        .eq('file_id', fileId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("❌ Erro ao atualizar influência do arquivo:", error.message);
    }
  };

  const handleRemoveFile = async (fileId) => {
    try {
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('project_id', projectId)
        .eq('file_id', fileId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("❌ Erro ao desvincular arquivo:", error.message);
    }
  };

  const handleDragStart = (e, fileId) => {
    e.dataTransfer.setData('text/plain', fileId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetTag) => {
    e.preventDefault();
    const fileId = e.dataTransfer.getData('text/plain');
    if (fileId) {
      await handleUpdateFileTag(fileId, targetTag);
    }
  };

  const filteredVaultFiles = availableVaultFiles.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !projectFiles.some(pf => pf.id === file.id)
  );

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center border border-[#262626] bg-[#050505]">
        <div className="flex items-center gap-3 font-mono text-xs text-[#737373] uppercase tracking-widest">
          <Loader2 size={16} className="animate-spin text-[var(--color-plan)]" /> Sincronizando Matriz Espacial...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-[#0A0A0A] p-6 border border-[#262626]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#262626] pb-6">
        <div>
          <h2 className="font-serif text-xl font-black uppercase text-[#F2EFE9] flex items-center gap-3">
            <Database size={18} className="text-[var(--color-plan)]" /> Cofre de Contexto Customizável
          </h2>
          <p className="text-xs font-mono text-[#737373] uppercase tracking-widest mt-1">
            Dados isolados com controle estrito de peso, física orbital, cores e intenção.
          </p>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="bg-[#101010] text-[#F2EFE9] border border-[#262626] px-4 py-2.5 font-mono text-xs uppercase tracking-widest hover:border-[var(--color-plan)] hover:text-[var(--color-plan)] transition-all flex items-center gap-2 font-bold"
          >
            <Plus size={14} /> Injetar do Cofre
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#101010] border border-[#262626] z-50 p-4 space-y-3 shadow-2xl">
              <div className="flex items-center gap-2 bg-[#0A0A0A] border border-[#262626] px-2 py-1.5">
                <Search size={14} className="text-[#525252]" />
                <input 
                  type="text" 
                  placeholder="FILTRAR COFRE..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-mono text-[#F2EFE9] placeholder-[#525252] w-full uppercase"
                />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 font-mono text-xs">
                {filteredVaultFiles.length > 0 ? filteredVaultFiles.map(file => (
                  <button 
                    key={file.id}
                    onClick={() => handleAttachFile(file.id)}
                    className="w-full text-left p-2 hover:bg-[#151515] text-[#A3A3A3] hover:text-[var(--color-plan)] transition-colors truncate block"
                  >
                    // {file.name}
                  </button>
                )) : (
                  <span className="text-[#525252] text-[10px] block p-2 uppercase">Nenhum recurso disponível_</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUNA BASE */}
        <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'base')} className="border border-[#262626] bg-[#050505] p-4 min-h-[400px] flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="font-mono text-[10px] uppercase text-[#737373] tracking-widest font-bold">Contexto Base</span>
            <span className="bg-[#101010] px-2 py-0.5 border border-[#262626] text-mono text-[9px] text-[#A3A3A3]">{projectFiles.filter(f => f.tag === 'base').length}</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {projectFiles.filter(f => f.tag === 'base').map(file => (
              <FileCard key={file.id} file={file} onDragStart={handleDragStart} onRemove={handleRemoveFile} />
            ))}
          </div>
        </div>

        {/* COLUNA BONS EXEMPLOS */}
        <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'bom')} className="border border-green-900/20 bg-[#050505] p-4 min-h-[400px] flex flex-col space-y-4 relative">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-green-500/30" />
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="font-mono text-[10px] uppercase text-green-500/70 tracking-widest font-bold flex items-center gap-1.5"><ThumbsUp size={10}/> Benchmarks</span>
            <span className="bg-[#101010] px-2 py-0.5 border border-[#262626] text-mono text-[9px] text-green-500/70">{projectFiles.filter(f => f.tag === 'bom').length}</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {projectFiles.filter(f => f.tag === 'bom').map(file => (
              <FileCard key={file.id} file={file} onDragStart={handleDragStart} onRemove={handleRemoveFile} />
            ))}
          </div>
        </div>

        {/* COLUNA MAUS EXEMPLOS */}
        <div onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'ruim')} className="border border-red-900/20 bg-[#050505] p-4 min-h-[400px] flex flex-col space-y-4 relative">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500/30" />
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="font-mono text-[10px] uppercase text-red-500/70 tracking-widest font-bold flex items-center gap-1.5"><ThumbsDown size={10}/> Anti-Patterns</span>
            <span className="bg-[#101010] px-2 py-0.5 border border-[#262626] text-mono text-[9px] text-red-500/70">{projectFiles.filter(f => f.tag === 'ruim').length}</span>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {projectFiles.filter(f => f.tag === 'ruim').map(file => (
              <FileCard key={file.id} file={file} onDragStart={handleDragStart} onRemove={handleRemoveFile} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileCard({ file, onDragStart, onRemove }) {
  // 🔥 Aplica a cor customizada definida pelo usuário para o arquivo caso ela exista no banco
  const cardStyle = file.customColor ? { borderLeft: `3px solid ${file.customColor}` } : {};

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, file.id)}
      style={cardStyle}
      className="group relative border border-[#262626] bg-[#101010] p-3 flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-[#525252] transition-colors"
    >
      <GripVertical size={14} className="text-[#525252] cursor-grab flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-[#F2EFE9] truncate" title={file.name}>
          {file.customIcon && <span className="mr-1.5">{file.customIcon}</span>}
          {file.name}
        </p>
        <span className="font-mono text-[8px] text-[#525252] block uppercase tracking-wider mt-0.5">
          W: {file.weight} // X: {file.x} Y: {file.y} // INTENT: {file.intent}
        </span>
      </div>
      <button 
        onClick={() => onRemove(file.id)}
        className="opacity-0 group-hover:opacity-100 text-[#525252] hover:text-red-500 transition-all flex-shrink-0 absolute right-3"
      >
        <X size={14} />
      </button>
    </div>
  );
}