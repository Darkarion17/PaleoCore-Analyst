
import React, { useState, useEffect, useMemo } from 'react';
import type { Core, Section, Microfossil, Folder, SampleCore } from './types';
import CoreSelector from './components/CoreSelector';
import CoreDashboard from './components/CoreDashboard';
import AddCoreModal from './components/AddCoreModal';
import { BarChart3, Microscope, PlusCircle, LogOut, Loader2, List, Map as MapIcon, ChevronsLeft, ChevronsRight, Image, Info, Settings } from 'lucide-react';
import Logo from './components/Logo';
import { supabase } from './services/supabaseClient';
import * as coreService from './services/coreService';
import type { Session } from '@supabase/supabase-js';
import AuthPage from './components/AuthPage';
import CoreMap from './components/CoreMap';
import MapFilters from './components/MapFilters';
import { REGIONS, SAMPLE_DATA } from './constants';
import ImageAnalysisView from './components/ImageAnalysisView';
import AccountModal from './components/AccountModal';
import ConfirmModal from './components/ConfirmModal';
import AddFossilModal from './components/AddFossilModal';
import Toast from './components/Toast';


type SidebarView = 'list' | 'map' | 'imageAnalysis';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cores, setCores] = useState<Core[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [microfossils, setMicrofossils] = useState<Microfossil[]>([]);
  const [selectedCore, setSelectedCore] = useState<Core | null>(null);
  const [isCoreModalOpen, setIsCoreModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingCore, setEditingCore] = useState<Core | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>('list');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  
  const [isAddFossilModalOpen, setIsAddFossilModalOpen] = useState(false);
  const [fossilToCreate, setFossilToCreate] = useState<Partial<Microfossil> | null>(null);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean } | null>(null);

  const [confirmModalState, setConfirmModalState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      onConfirm: () => void;
  }>({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: () => {},
  });


  const [activeFilters, setActiveFilters] = useState({
    folderId: '',
    region: '',
    // Advanced filters like epoch, period, and microfossilId are now complex
    // as they require checking sections within each core. This basic filter
    // implementation on the parent core is kept for simplicity.
  });

  const handleFilterChange = (filterType: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handleClearFilters = () => {
    setActiveFilters({
      folderId: '',
      region: '',
    });
  };

  const filteredCores = useMemo(() => {
    // Note: Filtering by epoch, period, and microfossilId on the parent Core is complex.
    // This implementation will keep it simple and filter based on core properties for now.
    // A more advanced implementation would fetch sections for all cores to filter deeply.
    return cores.filter(core => {
      const { folderId, region } = activeFilters;
      if (folderId && core.folder_id !== folderId) return false;
      if (region && REGIONS[region]) {
        const regionBounds = REGIONS[region];
        const { lon, lat } = core.location;
        const lonCheck = region === 'Pacific Ocean' 
          ? (lon >= regionBounds.minLon || lon <= regionBounds.maxLon)
          : (lon >= regionBounds.minLon && lon <= regionBounds.maxLon);
        const latCheck = lat >= regionBounds.minLat && lat <= regionBounds.maxLat;
        if (!(lonCheck && latCheck)) return false;
      }
      return true;
    });
  }, [cores, activeFilters]);


  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  useEffect(() => {
    const getSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadData = async (userId: string) => {
    if (!userId) return;
    setLoading(true);
    try {
        const { cores, folders } = await coreService.fetchFoldersAndCores(userId);
        const { microfossils } = await coreService.fetchMicrofossils();
        setCores(cores);
        setFolders(folders);
        setMicrofossils(microfossils);
    } catch (error: any) {
        console.error('Error loading data:', error.message);
        setToast({ message: `Error loading data: ${error.message}`, type: 'error', show: true });
    } finally {
        setLoading(false);
        setInitialDataLoaded(true);
    }
  };
  
  useEffect(() => {
    if (session) {
        loadData(session.user.id);
    } else {
        setCores([]);
        setFolders([]);
        setMicrofossils([]);
        setSelectedCore(null);
        setInitialDataLoaded(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);
  
  useEffect(() => {
    if (!selectedCore || !cores.find(c => c.id === selectedCore.id)) {
      setSelectedCore(cores[0] ?? null);
    }
  }, [cores, selectedCore]);
  
  const handleLoadSampleData = async () => {
    if (!session) return;
    setLoading(true);
    try {
        await coreService.loadSampleData(SAMPLE_DATA, session.user.id);
        await loadData(session.user.id);
        setToast({ message: 'Sample data loaded successfully!', type: 'success', show: true });
    } catch (error: any) {
        console.error("Error loading sample data:", error.message);
        setToast({ message: `Error loading sample data: ${error.message}`, type: 'error', show: true });
    } finally {
        setLoading(false);
    }
  };

  const handleSelectCore = (core: Core) => {
    setSelectedCore(core);
  };
  
  const handleSelectCoreFromMap = (core: Core) => {
    setSelectedCore(core);
    setSidebarView('list');
  };

  const handleSaveCore = async (coreToSave: Core) => {
    if (!session) return;
    const isEditing = cores.some(c => c.id === coreToSave.id);

    try {
        const savedCore = await coreService.saveCore(coreToSave, session.user.id, isEditing);
        let updatedCores;
        if (isEditing) {
            updatedCores = cores.map(c => c.id === savedCore.id ? savedCore : c);
        } else {
            updatedCores = [...cores, savedCore];
        }
        setCores(updatedCores);
        setSelectedCore(savedCore);
        setIsCoreModalOpen(false);
        setEditingCore(null);
        setToast({ message: `Core "${savedCore.id}" saved.`, type: 'success', show: true });
    } catch (error: any) {
        console.error('Error saving core:', error.message);
        setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
    }
  };
  
  const handleDeleteCore = async (coreId: string) => {
    const coreName = cores.find(c => c.id === coreId)?.id || coreId;
    setConfirmModalState({
        isOpen: true,
        title: 'Delete Core',
        message: `Are you sure you want to permanently delete core "${coreName}" and all of its sections? This action cannot be undone.`,
        onConfirm: async () => {
            try {
                await coreService.deleteCore(coreId);
                const updatedCores = cores.filter(c => c.id !== coreId);
                setCores(updatedCores);

                if (selectedCore?.id === coreId) {
                    setSelectedCore(updatedCores[0] || null);
                }
                setToast({ message: `Core "${coreName}" deleted.`, type: 'success', show: true });
            } catch (error: any) {
                 console.error('Error deleting core:', error.message);
                 setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
            }
        },
    });
  };
  
  const handleAddFossil = async (newFossil: Microfossil) => {
    try {
        const savedFossil = await coreService.addFossil(newFossil);
        setMicrofossils(prev => [...prev, savedFossil]);
        setIsAddFossilModalOpen(false);
        setFossilToCreate(null);
    } catch (error: any) {
        console.error('Error adding fossil:', error.message);
        setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
    }
  };
    
  const handleCreateFolder = async (folderName: string) => {
    if (!session) return;
    try {
        const newFolder = await coreService.createFolder(folderName, session.user.id);
        setFolders(prev => [...prev, newFolder]);
    } catch (error: any) {
        console.error('Error creating folder:', error.message);
        setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
    }
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
        const updatedFolder = await coreService.renameFolder(folderId, newName);
        setFolders(prev => prev.map(f => f.id === folderId ? updatedFolder : f));
    } catch (error: any) {
        console.error('Error renaming folder:', error.message);
        setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
      const folderName = folders.find(f => f.id === folderId)?.name || 'this folder';
      setConfirmModalState({
          isOpen: true,
          title: 'Delete Folder',
          message: `Are you sure you want to delete the folder "${folderName}"? All cores inside will be moved to "Unfiled".`,
          onConfirm: async () => {
              try {
                  await coreService.deleteFolder(folderId);
                  setFolders(prev => prev.filter(f => f.id !== folderId));
                  // Visually move cores to unfiled immediately
                  setCores(prev => prev.map(c => c.folder_id === folderId ? { ...c, folder_id: undefined } : c));
              } catch (error: any) {
                   console.error('Error deleting folder:', error.message);
                   setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
              }
          },
      });
  };

  const handleMoveCore = async (coreId: string, folderId: string | null) => {
    try {
        const movedCore = await coreService.moveCore(coreId, folderId);
        setCores(prev => prev.map(c => c.id === coreId ? movedCore : c));
    } catch (error: any) {
        console.error('Error moving core:', error.message);
        setToast({ message: `Error: ${error.message}`, type: 'error', show: true });
    }
  };

  const handleOpenAddCoreModal = () => {
    setEditingCore(null);
    setIsCoreModalOpen(true);
  }
  
  const handleOpenEditCoreModal = (core: Core) => {
    setEditingCore(core);
    setIsCoreModalOpen(true);
  }
  
  const handleOpenAddFossilModal = (data: Partial<Microfossil> | null = null) => {
    setFossilToCreate(data);
    setIsAddFossilModalOpen(true);
  }
  
  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setLoading(false);
  }

  const handleGoToMap = () => {
    setSidebarView('map');
  };

  if (loading && !initialDataLoaded) {
    return (
        <div className="flex items-center justify-center h-screen bg-background-secondary text-accent-primary">
            <Loader2 size={48} className="animate-spin" />
        </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-content-muted text-center max-w-lg mx-auto">
      <div className="flex items-center gap-6 text-accent-primary mb-6">
          <BarChart3 size={64} strokeWidth={1.5} />
          <Logo size={80} strokeWidth={1.5}/>
          <Microscope size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-bold text-content-primary">Unlock the Planet's Past</h2>
      <p className="mt-2 mb-6 text-lg">Your journey into Earth's climate history begins here. Add your first core or load our sample dataset to start analyzing.</p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={handleOpenAddCoreModal}
          className="flex items-center justify-center gap-2 p-3 px-6 rounded-lg bg-accent-primary text-accent-primary-text font-bold hover:bg-accent-primary-hover transition-all duration-200 shadow-lg hover:shadow-cyan-500/30"
        >
          <PlusCircle size={20} />
          Add Your First Core
        </button>
        <button
          onClick={handleLoadSampleData}
          disabled={loading}
          className="flex items-center justify-center gap-2 p-3 px-6 rounded-lg bg-background-interactive text-content-primary font-bold hover:bg-background-interactive-hover transition-all duration-200 shadow-lg disabled:bg-background-tertiary disabled:cursor-wait"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Info size={20} />}
          Load Sample Data
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background-secondary font-sans">
      <aside className={`bg-background-primary flex flex-col border-r border-border-primary shadow-lg transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20 p-2' : 'w-80 p-4'}`}>
        <div className="flex flex-col flex-1 min-h-0">
            {isSidebarCollapsed ? (
                <>
                 <div className="flex flex-col items-center space-y-4 flex-1">
                    <button onClick={() => setSidebarView('list')} title="PaleoCore" className="text-accent-primary pt-1">
                        <Logo size={28} />
                    </button>
                    <button onClick={handleOpenAddCoreModal} title="Add New Core" className="p-2 rounded-md text-content-muted hover:bg-background-tertiary hover:text-accent-primary-hover transition-colors">
                        <PlusCircle size={22} />
                    </button>
                    <div className="flex flex-col items-center bg-background-tertiary p-1 rounded-lg space-y-1">
                        <button onClick={() => setSidebarView('list')} className={`p-1.5 rounded-md ${sidebarView === 'list' ? 'bg-accent-primary/20 text-accent-primary-hover' : 'text-content-muted hover:text-content-primary'}`} title="List View">
                            <List size={18}/>
                        </button>
                        <button onClick={() => setSidebarView('map')} className={`p-1.5 rounded-md ${sidebarView === 'map' ? 'bg-accent-primary/20 text-accent-primary-hover' : 'text-content-muted hover:text-content-primary'}`} title="Map View">
                            <MapIcon size={18}/>
                        </button>
                        <button onClick={() => setSidebarView('imageAnalysis')} className={`p-1.5 rounded-md ${sidebarView === 'imageAnalysis' ? 'bg-accent-primary/20 text-accent-primary-hover' : 'text-content-muted hover:text-content-primary'}`} title="Image Analysis">
                            <Image size={18}/>
                        </button>
                    </div>
                </div>
                </>
            ) : (
                <>
                <header className="mb-4">
                    <div className="flex items-center justify-between text-accent-primary">
                        <div className="flex items-center space-x-3">
                            <Logo size={32} />
                            <h1 className="text-2xl font-bold tracking-tight">PaleoCore</h1>
                        </div>
                        <div className="flex items-center">
                            <button onClick={() => setIsAccountModalOpen(true)} className="p-2 rounded-md text-content-muted hover:bg-background-tertiary hover:text-accent-primary-hover transition-colors" title="Account Settings">
                                <Settings size={20}/>
                            </button>
                            <button onClick={handleSignOut} className="p-2 rounded-md text-content-muted hover:bg-background-tertiary hover:text-accent-primary-hover transition-colors" title="Sign Out">
                                <LogOut size={20}/>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="px-1 mb-4">
                    <button
                    onClick={handleOpenAddCoreModal}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-accent-primary/20 text-accent-primary-hover hover:bg-accent-primary/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    >
                    <PlusCircle size={18} />
                    <span className="font-semibold text-sm">Add New Core</span>
                    </button>
                </div>
                
                <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-sm font-semibold text-content-muted">Projects</p>
                    <div className="flex items-center bg-background-tertiary p-1 rounded-lg">
                        <button onClick={() => setSidebarView('list')} className={`p-1.5 rounded-md ${sidebarView === 'list' ? 'bg-accent-primary/20 text-accent-primary-hover' : 'text-content-muted hover:text-content-primary'}`} title="List View">
                            <List size={18}/>
                        </button>
                        <button onClick={() => setSidebarView('map')} className={`p-1.5 rounded-md ${sidebarView === 'map' ? 'bg-accent-primary/20 text-accent-primary-hover' : 'text-content-muted hover:text-content-primary'}`} title="Map View">
                            <MapIcon size={18}/>
                        </button>
                         <button onClick={() => setSidebarView('imageAnalysis')} className={`p-1.5 rounded-md ${sidebarView === 'imageAnalysis' ? 'bg-accent-primary/20 text-accent-primary-hover' : 'text-content-muted hover:text-content-primary'}`} title="Image Analysis">
                            <Image size={18}/>
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                  <CoreSelector 
                    cores={cores}
                    folders={folders}
                    onSelectCore={handleSelectCore}
                    selectedCoreId={selectedCore?.id}
                    onCreateFolder={handleCreateFolder}
                    onRenameFolder={handleRenameFolder}
                    onDeleteFolder={handleDeleteFolder}
                    onMoveCore={handleMoveCore}
                  />
                </div>
                </>
            )}
        </div>
        
        <footer className={`mt-auto pt-4 ${isSidebarCollapsed ? '' : 'text-xs text-content-muted text-center'}`}>
             {!isSidebarCollapsed && (
                <>
                    <p>&copy; {new Date().getFullYear()} GeoDynamics Inc.</p>
                    <p className="truncate">Signed in as: 
                        <span className="font-semibold text-content-secondary ml-1">
                            {session.user.email}
                        </span>
                    </p>
                </>
             )}
            <div className={`border-t border-border-primary ${isSidebarCollapsed ? 'mt-0' : 'mt-4 pt-4'}`}>
                <button onClick={toggleSidebar} className="w-full flex items-center justify-center p-2 rounded-md text-content-muted hover:bg-background-tertiary hover:text-accent-primary-hover transition-colors" title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
                    {isSidebarCollapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
                </button>
            </div>
             {isSidebarCollapsed && (
                <>
                    <button onClick={() => setIsAccountModalOpen(true)} className="w-full flex items-center justify-center p-2 rounded-md text-content-muted hover:bg-background-tertiary hover:text-accent-primary-hover transition-colors" title="Account Settings">
                        <Settings size={20}/>
                    </button>
                    <button onClick={handleSignOut} className="w-full flex items-center justify-center p-2 rounded-md text-content-muted hover:bg-background-tertiary hover:text-accent-primary-hover transition-colors" title="Sign Out">
                        <LogOut size={20}/>
                    </button>
                </>
             )}
        </footer>
      </aside>
      
      <main className={`flex-1 transition-all duration-300 relative ${sidebarView === 'list' || sidebarView === 'imageAnalysis' ? 'bg-background-secondary p-6' : 'p-0'}`}>
        {sidebarView === 'list' && (
          <div className="h-full overflow-y-auto animate-fade-in">
            {cores.length > 0 && selectedCore ? (
              <CoreDashboard
                key={selectedCore.id}
                core={selectedCore}
                microfossils={microfossils}
                onEditCore={handleOpenEditCoreModal}
                onDeleteCore={handleDeleteCore}
                onGoToMap={handleGoToMap}
                setToast={setToast}
                onAddFossil={handleOpenAddFossilModal}
                userEmail={session.user.email!}
              />
            ) : initialDataLoaded && cores.length === 0 ? (
                renderEmptyState()
            ) : null}
          </div>
        )}
        {sidebarView === 'map' && (
          <>
            <MapFilters 
                filters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                folders={folders}
                microfossils={microfossils}
            />
            <CoreMap cores={filteredCores} selectedCore={selectedCore} onSelectCore={handleSelectCoreFromMap} isSidebarCollapsed={isSidebarCollapsed} />
          </>
        )}
        {sidebarView === 'imageAnalysis' && (
            <div className="h-full overflow-y-auto">
                <ImageAnalysisView onAddFossil={handleOpenAddFossilModal} />
            </div>
        )}
      </main>

      {isCoreModalOpen && (
          <AddCoreModal
            mode="core"
            onSaveCore={handleSaveCore} 
            onClose={() => { setIsCoreModalOpen(false); setEditingCore(null); }}
            coreToEdit={editingCore}
            folders={folders}
            onDeleteCore={handleDeleteCore}
           />
       )}
       
       {isAddFossilModalOpen && (
           <AddFossilModal
               onAddFossil={handleAddFossil}
               onClose={() => {
                   setIsAddFossilModalOpen(false);
                   setFossilToCreate(null);
               }}
               fossilToCreate={fossilToCreate}
           />
       )}

       {isAccountModalOpen && session && (
           <AccountModal 
               isOpen={isAccountModalOpen}
               onClose={() => setIsAccountModalOpen(false)}
               userEmail={session.user.email!}
           />
       )}
       <ConfirmModal
           isOpen={confirmModalState.isOpen}
           onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
           onConfirm={confirmModalState.onConfirm}
           title={confirmModalState.title}
           message={confirmModalState.message}
           confirmButtonText="Yes, Delete"
       />

       {toast && toast.show && (
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(null)}
            />
        )}
    </div>
  );
};

export default App;
