import '@src/Options.css';
import { t } from '@extension/i18n';
import { useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { deploySettingsStorage } from '@extension/storage';
import { ErrorDisplay, LoadingSpinner } from '@extension/ui';

const Options = () => {
  const { autoDeploy } = useStorage(deploySettingsStorage);

  return (
    <div className="App bg-slate-50 text-gray-900">
      <img src={chrome.runtime.getURL('options/sealos-logo.svg')} className="App-logo" alt="Sealos logo" />
      <h1 className="text-xl font-bold">{t('settingsHeading')}</h1>
      <label className="mb-2 flex max-w-md items-start gap-2 text-left text-sm text-gray-700">
        <input
          type="checkbox"
          className="mt-1"
          checked={autoDeploy}
          onChange={event => deploySettingsStorage.setAutoDeploy(event.target.checked)}
        />
        <span>
          {t('autoDeploySetting')}
          <br />
          <span className="text-xs text-gray-500">{t('autoDeploySettingDescription')}</span>
        </span>
      </label>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
