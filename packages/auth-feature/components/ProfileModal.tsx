import React, { useState, useEffect } from 'react';
import Modal from '../../shared-ui/components/common/Modal';
import AlertMessage from '../../shared-ui/components/common/AlertMessage';
import { AuthUser } from '../../shared-types';
import { useTranslation } from '../../core-hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';

interface ProfileModalProps {
  user: AuthUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: ReturnType<typeof useAuth>['updateUserProfile'];
  onChangePassword: ReturnType<typeof useAuth>['changePassword'];
  authError: string | null;
  setAuthErrorExt: (error: string | null) => void;
  isLoading: boolean;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUpdateProfile,
  onChangePassword,
  authError,
  setAuthErrorExt,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'view' | 'editUsername' | 'changePassword'>('view');
  
  const [newUsername, setNewUsername] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset form fields and messages when modal opens or user changes
      setNewUsername(user.username);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setFormError(null);
      setSuccessMessage(null);
      setAuthErrorExt(null); // Clear global auth errors too
      setActiveTab('view');
    }
  }, [isOpen, user, setAuthErrorExt]);

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setAuthErrorExt(null);

    if (!newUsername.trim()) {
      setFormError(t('profile.errorUsernameRequired'));
      return;
    }
    if (newUsername.trim() === user.username) {
      setFormError(t('profile.errorUsernameUnchanged'));
      return;
    }

    const success = await onUpdateProfile(newUsername, t);
    if (success) {
      setSuccessMessage(t('profile.successUsernameUpdated'));
      setActiveTab('view'); 
    } else {
      // authError from useAuth will be displayed if set by onUpdateProfile
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setAuthErrorExt(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setFormError(t('profile.errorAllPasswordFieldsRequired'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setFormError(t('profile.errorPasswordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 6) {
      setFormError(t('profile.errorNewPasswordShort'));
      return;
    }

    const success = await onChangePassword(currentPassword, newPassword, t);
    if (success) {
      setSuccessMessage(t('profile.successPasswordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setActiveTab('view');
    } else {
       // authError from useAuth will be displayed if set by onChangePassword
    }
  };
  
  const displayError = authError || formError;

  const renderViewTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">{t('profile.usernameLabel')}</label>
        <p className="mt-1 text-lg text-gray-900">{user.username}</p>
      </div>
      {user.email && (
        <div>
          <label className="block text-sm font-medium text-gray-700">{t('profile.emailLabel')}</label>
          <p className="mt-1 text-lg text-gray-900">{user.email}</p>
        </div>
      )}
      <div className="flex space-x-3 pt-2">
        <button
          onClick={() => setActiveTab('editUsername')}
          className="px-4 py-2 text-sm font-medium text-primary hover:text-teal-700 border border-primary hover:bg-teal-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-colors"
        >
          {t('profile.editUsernameButton')}
        </button>
        <button
          onClick={() => setActiveTab('changePassword')}
          className="px-4 py-2 text-sm font-medium text-primary hover:text-teal-700 border border-primary hover:bg-teal-50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary transition-colors"
        >
          {t('profile.changePasswordButton')}
        </button>
      </div>
    </div>
  );

  const renderEditUsernameTab = () => (
    <form onSubmit={handleUpdateUsername} className="space-y-4" id="edit-username-form">
      <div>
        <label htmlFor="profile-username" className="block text-sm font-medium text-gray-700">
          {t('profile.newUsernameLabel')}
        </label>
        <input
          type="text"
          id="profile-username"
          value={newUsername}
          onChange={(e) => { setNewUsername(e.target.value); setFormError(null); setAuthErrorExt(null); setSuccessMessage(null);}}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
        />
      </div>
    </form>
  );

  const renderChangePasswordTab = () => (
    <form onSubmit={handleChangePassword} className="space-y-4" id="change-password-form">
      <div>
        <label htmlFor="profile-current-password"className="block text-sm font-medium text-gray-700">
          {t('profile.currentPasswordLabel')}
        </label>
        <input
          type="password"
          id="profile-current-password"
          value={currentPassword}
          onChange={(e) => { setCurrentPassword(e.target.value); setFormError(null); setAuthErrorExt(null); setSuccessMessage(null);}}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="profile-new-password"className="block text-sm font-medium text-gray-700">
          {t('profile.newPasswordLabel')}
        </label>
        <input
          type="password"
          id="profile-new-password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setFormError(null); setAuthErrorExt(null); setSuccessMessage(null);}}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
        />
      </div>
      <div>
        <label htmlFor="profile-confirm-password"className="block text-sm font-medium text-gray-700">
          {t('profile.confirmNewPasswordLabel')}
        </label>
        <input
          type="password"
          id="profile-confirm-password"
          value={confirmNewPassword}
          onChange={(e) => { setConfirmNewPassword(e.target.value); setFormError(null); setAuthErrorExt(null); setSuccessMessage(null);}}
          disabled={isLoading}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-100"
        />
      </div>
    </form>
  );

  let modalTitle = t('profile.title');
  if (activeTab === 'editUsername') modalTitle = t('profile.editUsernameTitle');
  if (activeTab === 'changePassword') modalTitle = t('profile.changePasswordTitle');
  
  const modalFooter = (
    <div className="flex justify-between items-center w-full">
        <div>
          {activeTab !== 'view' && (
            <button
              type="button"
              onClick={() => { setActiveTab('view'); setFormError(null); setAuthErrorExt(null); setSuccessMessage(null);}}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {t('profile.backButton')}
            </button>
          )}
        </div>
        <div className="flex space-x-3">
            {activeTab === 'editUsername' && (
            <button
                type="submit"
                form="edit-username-form"
                disabled={isLoading || newUsername.trim() === user.username}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-teal-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 transition-colors"
            >
                {isLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>) : t('profile.saveChangesButton')}
            </button>
            )}
            {activeTab === 'changePassword' && (
            <button
                type="submit"
                form="change-password-form"
                disabled={isLoading || !currentPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-teal-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 transition-colors"
            >
                {isLoading ? (<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>) : t('profile.updatePasswordButton')}
            </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading && activeTab !== 'view'} // Allow closing if just viewing while something else loads
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 transition-colors"
            >
              {t('profile.closeButton')}
            </button>
        </div>
    </div>
  );


  return (
    <Modal title={modalTitle} show={isOpen} onClose={onClose} footer={modalFooter}>
      <div className="space-y-4">
        {displayError && <AlertMessage type="error" title={t('profile.errorTitle')} message={displayError} />}
        {successMessage && <AlertMessage type="success" title={t('profile.successTitle')} message={successMessage} />}

        {activeTab === 'view' && renderViewTab()}
        {activeTab === 'editUsername' && renderEditUsernameTab()}
        {activeTab === 'changePassword' && renderChangePasswordTab()}
      </div>
    </Modal>
  );
};

export default ProfileModal;