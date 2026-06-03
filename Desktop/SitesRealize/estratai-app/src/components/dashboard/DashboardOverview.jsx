import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Activity, CheckCircle2, AlertTriangle, Sliders } from 'lucide-react';
import { useDataCache } from '../../hooks/useDataCache';
import CompanyDNAMap from './CompanyDNAMap'; 

import ModalCoreDNA from './modals/ModalCoreDNA';
import ModalManageFiles from './modals/ModalManageFiles';
import ModalDelete from './modals/ModalDelete';
import ModalCreateProject from './modals/ModalCreateProject';

import { PLAN_LEVELS } from '../../constants/plans';

export default function DashboardOverview({ onSelectProject, userPlan = 'Starter' }) {
  const cache = useDataCache();

  const cachedProjects = cache.getProjects();
  const cachedVaultItems = cache.getVaultItems();

  const [projects, setProjects] = useState(() => cachedProjects?.data || []);
  const [vaultItems, setVaultItems] = useState(() => cachedVaultItems?.data || []);
  const [availableAgents, setAvailableAgents] = useState(() => cache.getAgents() || []);
  const [projectFilesLinks, setProjectFilesLinks] = useState(() => cache.getProjectFiles() || []);

  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(1);
  const [newProject, setNewProject] = useState({ name: '', files: [], agent: null });

  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const [isCoreOpen, setIsCoreOpen] = useState(false);
  const [coreData, setCoreData] = useState({ strategyText: '', linkedFiles: [] });

  const [managingFilesProject, setManagingFilesProject] = useState(null);
  const [managingSelectedFiles, setManagingSelectedFiles] = useState([]);

  const [mapPositions, setMapPositions] = useState({});
  const [coreName, setCoreName] = useState('CORE_DNA');

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    const initData = async () => {
      // Valida projects antes de refetch
      const shouldRefetchProjects = await validateProjectsTimestamp();

      // Só refetch se necessário
      const fetchPromises = [
        shouldRefetchProjects ? fetchData() : Promise.resolve(),
        fetchMapData()
      ];

      await Promise.all(fetchPromises);
      setIsMapLoaded(true);
    };

    initData();
  }, []);

  const validateProjectsTimestamp = async () => {
    if (!cachedProjects?.latestUpdate) return true; // Sem cache, refetch

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !data?.[0]) return true; // Erro, refetch

      // Se timestamp é igual, skip refetch
      return data[0].created_at !== cachedProjects.latestUpdate;
    } catch {
      return true; // Erro de conexão, refetch
    }
  };

  const fetchData = async () => {
    const [projRes, itemsRes, agentRes, pfRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('vault_items').select('*').order('created_at', { ascending: false }),
      supabase.from('agents').select('*').eq('is_active', true).order('created_at', { ascending: true }),
      supabase.from('project_files').select('*')
    ]);

    if (!projRes.error) {
      setProjects(projRes.data);
      const latestUpdate = projRes.data?.[0]?.created_at;
      cache.setProjects(projRes.data, latestUpdate);
    }
    if (!itemsRes.error) {
      setVaultItems(itemsRes.data);
      // ⚠️ Don't cache vault_items here - let DashboardInjection manage it
      // This prevents format conflicts (raw vs formatted)
    }
    if (!agentRes.error) {
      setAvailableAgents(agentRes.data);
      cache.setAgents(agentRes.data);
    }
    if (!pfRes.error) {
      setProjectFilesLinks(pfRes.data);
      cache.setProjectFiles(pfRes.data);
    }
  };

  const fetchMapData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const { data, error } = await supabase
        .from('map_settings')
        .select('*')
        .eq('user_id', authData.user.id)
        .limit(1)
        .single();

      if (error) {
        console.warn("Map settings not found or error occurred:", error.message);
        return;
      }

      if (data) {
        if (data.positions && Object.keys(data.positions).length > 0) {
          setMapPositions(data.positions);
        }
        if (data.core_name) setCoreName(data.core_name);
        setCoreData({
          strategyText: data.strategy_text || '',
          linkedFiles: data.linked_files || []
        });
      }
    } catch (err) {
      console.error("Error fetching map data:", err.message);
    }
  };

  const handleSaveMapState = async (newPositions, newCoreName) => {
    setMapPositions(newPositions);
    if (newCoreName) setCoreName(newCoreName);
    
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const { error } = await supabase
      .from('map_settings')
      .upsert({ 
        user_id: authData.user.id, 
        positions: newPositions, 
        core_name: newCoreName || coreName,
        strategy_text: coreData.strategyText,
        linked_files: coreData.linkedFiles,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) console.error("Erro ao sincronizar mapa:", error.message);
  };

  const handleSaveCore = async () => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return;

    const { error } = await supabase
      .from('map_settings')
      .upsert({
        user_id: authData.user.id,
        positions: mapPositions,
        core_name: coreName,
        strategy_text: coreData.strategyText,
        linked_files: coreData.linkedFiles,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (!error) {
      setIsCoreOpen(false);
      fetchMapData();
    }
  };

  const handleRenameProject = async (id, newName) => {
    const { error } = await supabase.from('projects').update({ name: newName }).eq('id', id);
    if (!error) {
      cache.invalidateProjects();
      fetchData();
    }
  };

  const toggleFileSelection = (id, type) => {
    if (type === 'project') {
      setNewProject(prev => ({ ...prev, files: prev.files.includes(id) ? prev.files.filter(f => f !== id) : [...prev.files, id] }));
    } else if (type === 'core') {
      setCoreData(prev => ({ ...prev, linkedFiles: prev.linkedFiles.includes(id) ? prev.linkedFiles.filter(f => f !== id) : [...prev.linkedFiles, id] }));
    } else if (type === 'manage') {
      setManagingSelectedFiles(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
    }
  };

  const handleOpenFileManagement = (proj) => {
    const currentFiles = projectFilesLinks.filter(pf => pf.project_id === proj.id).map(pf => pf.file_id);
    setManagingSelectedFiles(currentFiles);
    setManagingFilesProject(proj);
  };

  const handleSaveManagedFiles = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      const currentFileIds = projectFilesLinks
        .filter(pf => pf.project_id === managingFilesProject.id)
        .map(pf => pf.file_id);

      const uniqueNew = [...new Set(managingSelectedFiles)];
      const toDelete = currentFileIds.filter(id => !uniqueNew.includes(id));
      const toInsert = uniqueNew.filter(id => !currentFileIds.includes(id));

      if (toDelete.length > 0) {
        const { error } = await supabase
          .from('project_files')
          .delete()
          .eq('project_id', managingFilesProject.id)
          .in('file_id', toDelete);
        if (error) throw error;
      }

      if (toInsert.length > 0) {
        const fileLinks = toInsert.map(fId => ({
          project_id: managingFilesProject.id,
          file_id: fId,
          user_id: authData.user.id
        }));
        const { error } = await supabase.from('project_files').insert(fileLinks);
        if (error) throw error;
      }

      cache.invalidateProjectFiles();
      setManagingFilesProject(null);
      fetchData();
    } catch (error) {
      console.error("❌ Erro ao gerenciar arquivos:", error);
    }
  };

  const handleNextStep = async () => {
    if (step === 1 && !newProject.name) return;
    if (step === 2 && newProject.files.length === 0) return;
    if (step < 3) { 
      setStep(step + 1); 
    } else {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return; 

      const { data, error } = await supabase.from('projects').insert([{ 
        name: newProject.name, 
        agent_id: newProject.agent,
        user_id: authData.user.id 
      }]).select();

      if (!error && data) {
        const projectId = data[0].id;

        const fileLinks = newProject.files.map(fId => ({
          project_id: projectId,
          file_id: fId,
          user_id: authData.user.id
        }));

        await supabase.from('project_files').insert(fileLinks);

        cache.invalidateProjects();
        cache.invalidateProjectFiles();
        setIsCreating(false);
        setStep(1);
        setNewProject({ name: '', files: [], agent: null });
        fetchData();
      } else {
        console.error("Erro ao criar projeto Multi-Tenant:", error);
      }
    }
  };

  const handleDeleteProject = async () => {
    if (projectToDelete && deleteConfirmationText === projectToDelete.name) {
      const { error } = await supabase.from('projects').delete().eq('id', projectToDelete.id);
      if (!error) {
        cache.invalidateProjects();
        cache.invalidateProjectFiles();
        setProjectToDelete(null);
        setDeleteConfirmationText('');
        fetchData();
      }
    }
  };

  return (
    <div className="space-y-10 relative">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="font-serif text-4xl font-black uppercase text-[#F2EFE9] mb-2">Visão Geral.</h1>
          <p className="text-[#737373] font-mono text-sm uppercase tracking-widest">Painel de controle estratégico.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-[var(--color-plan)] text-[#ffffff] p-4 hover:bg-[#710CCD] transition-colors flex items-center gap-3 font-mono text-xs uppercase tracking-widest font-bold">
          <Plus size={16} /> Nova Consultoria
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-[#262626] bg-[#101010] p-6 flex items-start gap-4">
          <Activity className="text-[var(--color-plan)] mt-1" size={20} />
          <div>
            <span className="block font-mono text-[10px] text-[#737373] uppercase tracking-widest mb-1">Consultorias Ativas</span>
            <span className="font-serif text-3xl text-[#F2EFE9]">{projects.length.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="border border-[#262626] bg-[#101010] p-6 flex items-start gap-4">
          <CheckCircle2 className="text-[#525252] mt-1" size={20} />
          <div>
            <span className="block font-mono text-[10px] text-[#737373] uppercase tracking-widest mb-1">Ficheiros Indexados</span>
            <span className="font-serif text-3xl text-[#F2EFE9]">{vaultItems.filter(i => i.type !== 'folder').length.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <div className="border border-red-900/30 bg-[#101010] p-6 flex items-start gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-red-500/50" />
          <AlertTriangle className="text-red-500/80 mt-1" size={20} />
          <div>
            <span className="block font-mono text-[10px] text-red-500/80 uppercase tracking-widest mb-1">Alerta de Risco</span>
            <span className="font-serif text-3xl text-[#F2EFE9]">00</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#262626] pb-2">
          <span className="font-mono text-[10px] uppercase text-[#737373] tracking-widest flex items-center gap-2"><Sliders size={12}/> Sistema Nervoso // Nodes Integrados</span>
          <span className="font-mono text-[9px] text-[#525252] uppercase animate-pulse">Supabase Sync Active_</span>
        </div>
        
        {isMapLoaded ? (
          <CompanyDNAMap 
            projects={projects} 
            availableAgents={availableAgents} 
            projectFilesLinks={projectFilesLinks}
            onSelectProject={onSelectProject} 
            setProjectToDelete={setProjectToDelete}
            onRenameProject={handleRenameProject} 
            onOpenCore={() => setIsCoreOpen(true)}
            onManageFiles={handleOpenFileManagement} 
            initialPositions={mapPositions}
            initialCoreName={coreName}
            onSaveMapState={handleSaveMapState}
          />
        ) : (
          <div className="w-full h-[650px] bg-[#050505] border border-[#262626] flex items-center justify-center">
            <span className="font-mono text-xs uppercase tracking-widest text-[#525252] animate-pulse">Carregando DNA da Empresa...</span>
          </div>
        )}
      </div>

      <ModalCoreDNA isOpen={isCoreOpen} onClose={() => setIsCoreOpen(false)} coreData={coreData} setCoreData={setCoreData} vaultItems={vaultItems} toggleFileSelection={toggleFileSelection} handleSaveCore={handleSaveCore} />
      <ModalManageFiles isOpen={!!managingFilesProject} onClose={() => setManagingFilesProject(null)} project={managingFilesProject} vaultItems={vaultItems} managingSelectedFiles={managingSelectedFiles} toggleFileSelection={toggleFileSelection} handleSaveManagedFiles={handleSaveManagedFiles} />
      <ModalDelete isOpen={!!projectToDelete} onClose={() => setProjectToDelete(null)} project={projectToDelete} deleteConfirmationText={deleteConfirmationText} setDeleteConfirmationText={setDeleteConfirmationText} handleDeleteProject={handleDeleteProject} />
      <ModalCreateProject isOpen={isCreating} onClose={() => { setIsCreating(false); setStep(1); }} step={step} setStep={setStep} newProject={newProject} setNewProject={setNewProject} vaultItems={vaultItems} availableAgents={availableAgents} userPlan={userPlan} toggleFileSelection={toggleFileSelection} handleNextStep={handleNextStep} />
    </div>
  );
}