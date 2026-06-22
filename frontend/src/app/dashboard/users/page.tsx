'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';
import type { User } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create / Edit user form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [barAssociation, setBarAssociation] = useState('');
  
  // Impersonation state
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Delete confirm state
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification / Error modal states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const data = await authService.listUsers();
      setUsers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kullanıcı listesi alınamadı.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsers();
    }
  }, [currentUser]);

  // Form helper to reset states
  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setBirthDate('');
    setBarAssociation('');
    setEditingUser(null);
    setIsModalOpen(false);
  };

  // Open modal in create mode
  const handleCreateClick = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Open modal in edit mode
  const handleEditClick = (u: User) => {
    setEditingUser(u);
    setEmail(u.email);
    setFullName(u.fullName || '');
    setBirthDate(u.birthDate ? u.birthDate.split('T')[0] : '');
    setBarAssociation(u.barAssociation || '');
    setPassword(''); // leave blank by default
    setIsModalOpen(true);
  };

  // Submit handler (handles both create and edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (editingUser) {
        // Edit mode
        await authService.updateUser(editingUser.userId, {
          email,
          fullName,
          password: password || undefined, // only update if filled
          birthDate,
          barAssociation,
        });
        setSuccessMsg('Kullanıcı başarıyla güncellendi.');
      } else {
        // Create mode
        await authService.createUser({
          email,
          password,
          fullName,
          birthDate,
          barAssociation,
        });
        setSuccessMsg('Kullanıcı başarıyla oluşturuldu.');
      }
      
      resetForm();
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'İşlem gerçekleştirilirken bir hata oluştu.';
      setErrorMsg(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete click confirm handler
  const handleDeleteConfirm = async () => {
    if (!deletingUserId) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await authService.deleteUser(deletingUserId);
      setSuccessMsg('Kullanıcı başarıyla silindi.');
      setDeletingUserId(null);
      fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kullanıcı silinemedi.';
      setErrorMsg(message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Direct login / Impersonation handler
  const handleImpersonate = async (userId: string) => {
    setIsImpersonating(true);
    setErrorMsg(null);
    try {
      const res = await authService.impersonate(userId);
      // Open new tab/window using the token in query parameter
      window.open(`/dashboard?token=${res.access_token}`, '_blank');
      setSuccessMsg('Kullanıcı hesabı yeni sekmede başarıyla açıldı.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kullanıcının paneline doğrudan giriş yapılamadı.';
      setErrorMsg(message);
    } finally {
      setIsImpersonating(false);
    }
  };

  // Access control check
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Erişim Yetkiniz Yok</h2>
        <p className="text-sm text-[var(--text-muted)] max-w-sm">
          Bu sayfayı görüntülemek için yönetici yetkilerine sahip olmanız gerekmektedir.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-slide-up">
      {/* Impersonation Overlay Spinner */}
      {isImpersonating && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white">
          <LoadingSpinner size="lg" />
          <p className="text-lg font-medium animate-pulse">Seçilen Kullanıcı Paneline Geçiş Yapılıyor...</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Sisteme giriş yapabilecek avukat ve kullanıcı hesaplarını yönetin (Ekle, Sil, Güncelle, Doğrudan Giriş)
          </p>
        </div>
        <Button
          onClick={handleCreateClick}
          className="shadow-lg shadow-[var(--accent)]/20"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Yeni Kullanıcı Oluştur
        </Button>
      </div>

      {/* Success notification banner */}
      {successMsg && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex justify-between items-center">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-300 font-medium text-xs underline">
            Kapat
          </button>
        </div>
      )}

      {/* User list */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-3">
            <LoadingSpinner size="md" />
            <span className="text-sm text-[var(--text-muted)]">Kullanıcılar yükleniyor...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <p className="text-sm text-[var(--text-muted)]">Kayıtlı kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-tertiary)]/50 text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                  <th className="px-6 py-4">Ad Soyad</th>
                  <th className="px-6 py-4">E-posta</th>
                  <th className="px-6 py-4">Doğum Tarihi</th>
                  <th className="px-6 py-4">Barosu</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Kayıt Tarihi</th>
                  <th className="px-6 py-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-sm text-[var(--text-secondary)]">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                      {u.fullName || '-'}
                    </td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">{u.birthDate ? new Date(u.birthDate).toLocaleDateString('tr-TR') : '-'}</td>
                    <td className="px-6 py-4">{u.barAssociation || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'admin' 
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {u.role === 'admin' ? 'Yönetici' : 'Avukat'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('tr-TR') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {u.userId !== currentUser?.userId && (
                        <button
                          onClick={() => handleImpersonate(u.userId)}
                          title="Bu Kullanıcı Olarak Doğrudan Giriş Yap"
                          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleEditClick(u)}
                        title="Düzenle"
                        className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {u.userId !== currentUser?.userId && (
                        <button
                          onClick={() => setDeletingUserId(u.userId)}
                          title="Sil"
                          className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingUser ? "Kullanıcı Bilgilerini Güncelle" : "Yeni Kullanıcı Tanımla"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Ad Soyad"
            type="text"
            required
            placeholder="Av. Ad Soyad"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="E-posta"
            type="email"
            required
            placeholder="ornek@buro.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label={editingUser ? "Şifre (Değiştirmek istemiyorsanız boş bırakın)" : "Şifre"}
            type="password"
            required={!editingUser}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Doğum Tarihi"
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
            <Input
              label="Barosu"
              type="text"
              required
              placeholder="örn. İstanbul Barosu"
              value={barAssociation}
              onChange={(e) => setBarAssociation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={resetForm}
              disabled={isSaving}
            >
              İptal
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
            >
              {editingUser ? "Güncelle" : "Tanımla"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        title="Kullanıcıyı Sil"
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve kullanıcının tüm verileri silinecektir.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeletingUserId(null)}
              disabled={isDeleting}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              isLoading={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={!!errorMsg}
        onClose={() => setErrorMsg(null)}
        title="İşlem Hatası"
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {errorMsg}
          </p>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setErrorMsg(null)}>
              Tamam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
