import React from 'react';
import { useI18n } from '@hooks/useI18n';
import {languages} from '@i18n/ui';
import {SpainFlag, EnglishFlag} from '@assets/flags/flags.jsx'

export function LanguagePicker() {
  const { currentLang, getLanguageUrl, isInitialized } = useI18n();
  
  // No renderizar hasta que se inicialice para evitar parpadeos
  if (!isInitialized) return null;

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle">
        <span className="font-medium">{currentLang === 'en' ? <EnglishFlag className="w-2 h-2" /> : <SpainFlag className="w-2 h-2" />}</span>
      </label>
      <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
        {Object.entries(languages).map(([lang, label]) => (
          <li key={lang}>
            <a 
              href={getLanguageUrl(lang)}
              className={currentLang === lang ? "active" : ""}
            >
              {lang === 'en' ? <EnglishFlag className="w-2 h-2" /> : <SpainFlag className="w-2 h-2" />} {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}