import '@src/Popup.css';
import { t } from '@extension/i18n';
import { SEALOS_CONSOLE_URL_OBJECT, withErrorBoundary, withSuspense } from '@extension/shared';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

const Popup = () => {
  const openSealos = () => chrome.tabs.create(SEALOS_CONSOLE_URL_OBJECT);

  return (
    <div className="App bg-slate-50 text-gray-900">
      <header className="App-header text-gray-900">
        <img src={chrome.runtime.getURL('popup/sealos-logo.svg')} className="App-logo" alt="Sealos logo" />
        <h1 className="text-lg font-bold">{t('popupTitle')}</h1>
        <p className="max-w-xs text-sm text-gray-600">{t('popupDescription')}</p>
        <button
          className="mt-4 rounded bg-blue-600 px-4 py-1 font-bold text-white shadow hover:scale-105"
          onClick={openSealos}>
          {t('openSealos')}
        </button>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Popup, <LoadingSpinner />), ErrorDisplay);
