import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, UserPlus, FileSpreadsheet, Trash2, Key, RefreshCw, AlertCircle, CheckCircle, Search, Edit3, Lock, ShieldAlert, Link as LinkIcon, ExternalLink, Sparkles, Shield } from 'lucide-react';
import { WhitelistEntry, AuditLog } from '../types';
import { fetchWhitelist, addWhitelistEmail, deleteWhitelistEmail, fetchAuditLogs, updateLessonAdmin, fetchGoogleSheetConfig, triggerGoogleSheetSync } from '../lib/api';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [adminKey, setAdminKey] = useState('cakto2026');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'whitelist' | 'sheets' | 'import' | 'audit' | 'lessons'>('whitelist');
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Sheets Sync state
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [lastGoogleSheetSync, setLastGoogleSheetSync] = useState<string | null>(null);
  const [sheetSyncing, setSheetSyncing] = useState(false);

  // Form states for adding single student
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Form state for bulk spreadsheet import
  const [bulkText, setBulkText] = useState('');

  // Search filter
  const [searchFilter, setSearchFilter] = useState('');

  // Lesson Edit state
  const [lessonIdToEdit, setLessonIdToEdit] = useState('l0_1');
  const [editTitle, setEditTitle] = useState('');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleAdminAuth = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchWhitelist(adminKey);
      setWhitelist(data);
      setIsAuthenticated(true);
      loadAudit();
      loadSheetConfig();
    } catch (err: any) {
      setError(err.message || 'Chave mestra de administrador incorreta.');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadSheetConfig = async () => {
    try {
      const cfg = await fetchGoogleSheetConfig(adminKey);
      if (cfg) {
        setGoogleSheetUrl(cfg.googleSheetUrl || '');
        setLastGoogleSheetSync(cfg.lastGoogleSheetSync || null);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleSyncGoogleSheet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!googleSheetUrl.trim()) {
      setError('Por favor informe o link da sua planilha Google Sheets.');
      return;
    }

    setSheetSyncing(true);
    setError(null);
    try {
      const res = await triggerGoogleSheetSync(adminKey, { sheetUrl: googleSheetUrl.trim() });
      setLastGoogleSheetSync(res.lastGoogleSheetSync);
      setSuccessMsg(`Sincronização com Google Sheets realizada com sucesso! Total de ${res.totalSyncedCount} e-mails autorizados.`);
      const updatedWhitelist = await fetchWhitelist(adminKey);
      setWhitelist(updatedWhitelist);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadAudit();
    } catch (err: any) {
      setError(err.message || 'Falha ao conectar e sincronizar planilha.');
    } finally {
      setSheetSyncing(false);
    }
  };

  useEffect(() => {
    // Try auto-authenticating with default key
    handleAdminAuth();
  }, []);

  const loadAudit = async () => {
    try {
      const logs = await fetchAuditLogs(adminKey);
      setAuditLogs(logs);
    } catch (e) {
      // ignore
    }
  };

  const handleAddSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      setError('Por favor informe um e-mail válido.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await addWhitelistEmail(adminKey, {
        email: newEmail,
        name: newName,
        notes: newNotes
      });
      setWhitelist(res.whitelist);
      setNewEmail('');
      setNewName('');
      setNewNotes('');
      setSuccessMsg('E-mail do comprador adicionado com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
      loadAudit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      setError('Cole a lista de e-mails da planilha.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await addWhitelistEmail(adminKey, {
        action: 'bulk_import',
        emails: bulkText
      });
      setSuccessMsg(`Importação concluída! ${res.count} novos e-mails adicionados.`);
      setBulkText('');
      // refresh
      const updated = await fetchWhitelist(adminKey);
      setWhitelist(updated);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadAudit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (id: string, email: string) => {
    if (!confirm(`Remover o e-mail ${email} da lista de autorizados? O aluno perderá acesso imediatamente.`)) return;

    setLoading(true);
    try {
      await deleteWhitelistEmail(adminKey, id);
      setWhitelist(whitelist.filter(i => i.id !== id));
      setSuccessMsg(`Acesso de ${email} revogado.`);
      setTimeout(() => setSuccessMsg(null), 3000);
      loadAudit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateLessonAdmin(adminKey, lessonIdToEdit, {
        title: editTitle,
        videoUrl: editVideoUrl,
        description: editDesc
      });
      setSuccessMsg('Vídeo da aula atualizado no servidor com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredWhitelist = whitelist.filter(
    (item) =>
      item.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl adsata-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 lg:p-5 bg-[#0B0F10] border-b border-[#1E272B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#153A2D] border border-[#22E025]/40 flex items-center justify-center text-[#22E025]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base flex items-center gap-2">
                Painel do Mentor • Gestão de Segurança & Alunos
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                Gerenciamento da Planilha de E-mails Autorizados e Links de Vídeo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#153A2D]/40 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unauthenticated Admin Prompt */}
        {!isAuthenticated ? (
          <div className="p-8 text-center max-w-md mx-auto my-auto space-y-4">
            <Lock className="w-10 h-10 text-[#22E025] mx-auto" />
            <h3 className="text-lg font-bold text-white">Chave Mestra de Administrador</h3>
            <p className="text-xs text-gray-400">
              Digite a chave de segurança para gerenciar a planilha de e-mails autorizados.
            </p>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Chave (padrão: cakto2026)"
                className="w-full adsata-input rounded-xl px-4 py-2.5 text-xs text-white text-center font-mono"
              />
              <button
                type="submit"
                className="w-full hero-cta py-2.5 text-xs font-bold cursor-pointer"
              >
                Acessar Painel
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Dashboard */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Tabs */}
            <div className="bg-[#0B0F10] border-b border-[#1E272B] px-4 pt-2 flex gap-4 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveTab('whitelist')}
                className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'whitelist'
                    ? 'border-[#22E025] text-[#22E025]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Alunos Autorizados ({whitelist.length})
              </button>

              <button
                onClick={() => setActiveTab('sheets')}
                className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'sheets'
                    ? 'border-[#22E025] text-[#22E025]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-[#22E025]" />
                Google Sheets Auto-Sync
              </button>

              <button
                onClick={() => setActiveTab('import')}
                className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'import'
                    ? 'border-[#22E025] text-[#22E025]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Importar Planilha (CSV / Excel)
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'border-[#22E025] text-[#22E025]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Logs de Segurança ({auditLogs.length})
              </button>

              <button
                onClick={() => setActiveTab('lessons')}
                className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'lessons'
                    ? 'border-[#22E025] text-[#22E025]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Editar Links dos Vídeos
              </button>
            </div>

            {/* Notification Banners */}
            {error && (
              <div className="m-4 p-3 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="m-4 p-3 bg-[#153A2D] border border-[#22E025]/50 text-[#22E025] text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-[#22E025] shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Tab 1: Whitelist Table & Single Add */}
            {activeTab === 'whitelist' && (
              <div className="p-4 lg:p-6 overflow-y-auto space-y-6">
                
                {/* Form: Add single student */}
                <form onSubmit={handleAddSingleStudent} className="bg-[#0B0F10] border border-[#1E272B] rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-[#22E025] uppercase tracking-wider flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    Adicionar Novo Comprador Manualmente
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="e-mail-comprador@exemplo.com"
                      className="adsata-input rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Nome do Aluno (opcional)"
                      className="adsata-input rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="hero-cta py-2 px-4 text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      Autorizar Acesso
                    </button>
                  </div>
                </form>

                {/* Search in Whitelist */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 bg-[#0B0F10] border border-[#1E272B] rounded-xl px-3 py-1.5 w-64">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filtrar e-mails autorizados..."
                      className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
                    />
                  </div>
                  <span className="text-xs text-[#22E025] font-semibold">
                    Total: {filteredWhitelist.length} alunos cadastrados
                  </span>
                </div>

                {/* Table */}
                <div className="border border-[#1E272B] rounded-2xl overflow-hidden bg-[#0B0F10]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#153A2D]/40 text-[#22E025] font-bold uppercase text-[10px] border-b border-[#1E272B]">
                      <tr>
                        <th className="p-3">E-mail Cadastrado</th>
                        <th className="p-3">Nome / Notas</th>
                        <th className="p-3">Data Compra</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E272B]">
                      {filteredWhitelist.map((item) => (
                        <tr key={item.id} className="hover:bg-[#153A2D]/20 transition-colors">
                          <td className="p-3 font-semibold text-white font-mono">{item.email}</td>
                          <td className="p-3 text-gray-300">{item.name}</td>
                          <td className="p-3 text-gray-500 font-mono">{item.purchaseDate}</td>
                          <td className="p-3">
                            <span className="adsata-badge text-[10px]">
                              ATIVO
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteEntry(item.id, item.email)}
                              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                              title="Revogar Acesso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* Tab: Google Sheets Live Sync */}
            {activeTab === 'sheets' && (
              <div className="p-4 lg:p-6 overflow-y-auto space-y-5">
                <div className="bg-[#0B0F10] border border-[#1E272B] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#153A2D] border border-[#22E025]/40 flex items-center justify-center text-[#22E025] shrink-0">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        Integração com Google Sheets (Live Sync)
                        <span className="adsata-badge text-[10px]">
                          <span className="pulse-dot" />
                          Conexão Direta
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400">
                        Conecte a planilha do Google Sheets onde você insere os e-mails dos compradores da mentoria. O servidor autoriza os e-mails automaticamente no momento do login.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSyncGoogleSheet} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-[#22E025] mb-1.5">
                        Link de Compartilhamento da sua Planilha no Google Sheets
                      </label>
                      <div className="relative">
                        <LinkIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="url"
                          required
                          value={googleSheetUrl}
                          onChange={(e) => setGoogleSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/1.../edit?usp=sharing"
                          className="w-full adsata-input rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5 leading-relaxed">
                        📌 <strong>Como configurar:</strong> No Google Sheets, clique em <strong>Compartilhar</strong> ➔ Selecione <strong>"Qualquer pessoa com o link pode ver"</strong> e cole o link acima.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#153A2D]/20 border border-[#22E025]/30 p-3.5 rounded-xl">
                      <div className="text-xs text-gray-300 space-y-0.5">
                        <p className="font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#22E025]" />
                          Status de Conexão:
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {lastGoogleSheetSync
                            ? `Sincronizado pela última vez em: ${new Date(lastGoogleSheetSync).toLocaleString('pt-BR')}`
                            : 'Nenhuma planilha sincronizada ainda.'}
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={sheetSyncing || !googleSheetUrl.trim()}
                        className="hero-cta py-2.5 px-5 text-xs font-bold cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {sheetSyncing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#050E06]" />
                            Conectando à Planilha...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-[#050E06]" />
                            Sincronizar E-mails da Planilha
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Security Guarantee Box */}
                <div className="bg-[#0B0F10] border border-[#1E272B] rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-[#22E025] uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#22E025]" />
                    Garantia de Segurança Antifraude & Zero Burlar
                  </h4>
                  <ul className="text-xs text-gray-300 space-y-2 list-disc list-inside leading-relaxed">
                    <li>
                      <strong>Validação Server-Side Fechada:</strong> Todo o conteúdo da mentoria fica restrito no servidor Node.js. Nenhuma aula ou link é exposto para quem inspeciona o código antes de estar autenticado.
                    </li>
                    <li>
                      <strong>Single Source of Truth:</strong> O servidor lê a sua planilha Google em tempo real. Se o e-mail não constar lá, o acesso é bloqueado na hora.
                    </li>
                    <li>
                      <strong>Código Único PIN no Servidor:</strong> A autenticação utiliza verificação de 6 dígitos gerada server-side, impedindo que hackers simulem sessões ativas.
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: Bulk Import Spreadsheet */}
            {activeTab === 'import' && (
              <div className="p-4 lg:p-6 overflow-y-auto space-y-4">
                <div className="bg-[#0B0F10] border border-[#1E272B] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-[#22E025]" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Importação em Lote da Planilha (Google Sheets / Excel)</h3>
                      <p className="text-xs text-gray-400">
                        Copie a coluna de e-mails da sua planilha e cole na caixa abaixo (um e-mail por linha ou separados por vírgula).
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleBulkImport} className="space-y-4">
                    <textarea
                      rows={8}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder={`aluno1@gmail.com\naluno2@hotmail.com\naluno3@yahoo.com.br`}
                      className="w-full adsata-input rounded-xl p-4 text-xs font-mono"
                    />

                    <button
                      type="submit"
                      disabled={loading || !bulkText.trim()}
                      className="w-full hero-cta py-3 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? 'Importando e-mails...' : 'Processar e Autorizar Todos os E-mails'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Tab 3: Security Audit Logs */}
            {activeTab === 'audit' && (
              <div className="p-4 lg:p-6 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#22E025] uppercase tracking-wider">
                    Registro de Acessos ao Servidor
                  </h3>
                  <button
                    onClick={loadAudit}
                    className="text-xs text-[#22E025] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Atualizar Logs
                  </button>
                </div>

                <div className="border border-[#1E272B] rounded-2xl overflow-hidden bg-[#0B0F10] space-y-1 p-2">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between font-mono ${
                        log.success
                          ? 'bg-[#153A2D]/20 border-[#22E025]/30 text-gray-200'
                          : 'bg-red-950/20 border-red-900/40 text-red-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${log.success ? 'text-[#22E025]' : 'text-red-400'}`}>
                            {log.action}
                          </span>
                          <span className="text-white">{log.email}</span>
                        </div>
                        <p className="text-[11px] opacity-80">{log.details}</p>
                      </div>
                      <div className="text-right text-[10px] opacity-60">
                        <p>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</p>
                        <p>{log.ip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Edit Video URLs */}
            {activeTab === 'lessons' && (
              <div className="p-4 lg:p-6 overflow-y-auto space-y-4">
                <form onSubmit={handleUpdateLesson} className="bg-[#0B0F10] border border-[#1E272B] rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#22E025]" />
                    Editar Link do Vídeo da Aula
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#22E025] mb-1 font-semibold">
                        Selecione a ID da Aula (ex: l0_1, l1_1, l2_1)
                      </label>
                      <input
                        type="text"
                        value={lessonIdToEdit}
                        onChange={(e) => setLessonIdToEdit(e.target.value)}
                        className="w-full adsata-input rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#22E025] mb-1 font-semibold">Novo Título da Aula</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Ex: Introdução à Mentoria Cakto"
                        className="w-full adsata-input rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#22E025] mb-1 font-semibold">Link do Vídeo (YouTube / Embed)</label>
                      <input
                        type="text"
                        value={editVideoUrl}
                        onChange={(e) => setEditVideoUrl(e.target.value)}
                        placeholder="https://www.youtube.com/embed/..."
                        className="w-full adsata-input rounded-xl px-3 py-2 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#22E025] mb-1 font-semibold">Descrição</label>
                      <textarea
                        rows={3}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Nova descrição para a aula..."
                        className="w-full adsata-input rounded-xl p-3 text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full hero-cta py-2.5 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Salvar Alterações na Aula
                  </button>
                </form>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
