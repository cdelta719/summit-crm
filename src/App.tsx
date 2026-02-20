import { AuthProvider, useAuth } from './store/AuthContext';
import { AppProvider, useApp } from './store/AppContext';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import PipelineBoard from './components/pipeline/PipelineBoard';
import ListView from './components/leads/ListView';
import LeadDetail from './components/leads/LeadDetail';
import Dashboard from './components/dashboard/Dashboard';
import AddLeadModal from './components/leads/AddLeadModal';
import ImportModal from './components/import-export/ImportModal';
import LoginPage from './components/auth/LoginPage';
import ProfilePage from './components/auth/ProfilePage';
// Team tab removed
import HelpDesk from './components/tickets/HelpDesk';
import ActiveClients from './components/clients/ActiveClients';
import Contracts from './components/contracts/Contracts';
import Reports from './components/reports/Reports';
import Training from './components/training/Training';
import TaskManager from './components/tasks/TaskManager';
import RevenueTracker from './components/revenue/RevenueTracker';
import EmailTemplates from './components/emails/EmailTemplates';
import Leaderboard from './components/leaderboard/Leaderboard';

function AppContent() {
  const { state } = useApp();

  if (state.loading) return (
    <div className="flex items-center justify-center h-screen bg-surface-0">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary text-sm">Loading leads...</p>
      </div>
    </div>
  );

  const renderView = () => {
    switch (state.currentView) {
      case 'pipeline': return <PipelineBoard />;
      case 'list': return <ListView />;
      case 'dashboard': return <Dashboard />;
      case 'detail': return <LeadDetail />;
      case 'profile': return <ProfilePage />;
      // team tab removed
      case 'clients': return <ActiveClients />;
      case 'contracts': return <Contracts />;
      case 'tickets': return <HelpDesk />;
      case 'reports': return <Reports />;
      case 'training': return <Training />;
      case 'tasks': return <TaskManager />;
      case 'revenue': return <RevenueTracker />;
      case 'emails': return <EmailTemplates />;
      case 'leaderboard': return <Leaderboard />;
      default: return <PipelineBoard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden bg-surface-0">
          {renderView()}
        </main>
      </div>
      <AddLeadModal />
      <ImportModal />
    </div>
  );
}

function AuthGate() {
  const { currentUser, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-surface-0">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary text-sm">Loading Summit CRM...</p>
      </div>
    </div>
  );

  if (!currentUser) return <LoginPage />;

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
