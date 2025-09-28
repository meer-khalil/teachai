import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import './LanguageSelector.css';

const LanguageSelector = ({ compact = false, showFlag = true, showName = true }) => {
  const { t } = useTranslation();
  const { 
    currentLanguage, 
    changeLanguage, 
    getCurrentLanguage, 
    getAvailableLanguages,
    setAutoDetectedLanguage 
  } = useLanguage();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = getCurrentLanguage();
  const availableLanguages = getAvailableLanguages();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    setIsChanging(true);
    setIsOpen(false);
    
    try {
      const success = await changeLanguage(languageCode);
      if (success) {
        // Show success message
        console.log(`Language changed to ${languageCode}`);
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const handleAutoDetect = () => {
    setAutoDetectedLanguage();
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (compact) {
    return (
      <div className="language-selector compact" ref={dropdownRef}>
        <button
          className={`language-trigger compact ${isOpen ? 'open' : ''}`}
          onClick={toggleDropdown}
          disabled={isChanging}
          aria-label={t('settings.language.selectLanguage')}
        >
          {showFlag && <span className="flag">{currentLang.flag}</span>}
          {showName && <span className="code">{currentLang.code.toUpperCase()}</span>}
          <span className="arrow">
            {isChanging ? '⟳' : '▼'}
          </span>
        </button>

        {isOpen && (
          <div className="language-dropdown compact">
            <div className="auto-detect-option" onClick={handleAutoDetect}>
              <span className="auto-icon">🌐</span>
              <span className="auto-text">{t('settings.language.autoDetect')}</span>
            </div>
            <div className="divider"></div>
            {availableLanguages.map((language) => (
              <div
                key={language.code}
                className={`language-option ${language.code === currentLanguage ? 'selected' : ''}`}
                onClick={() => handleLanguageChange(language.code)}
              >
                <span className="flag">{language.flag}</span>
                <span className="name">{language.nativeName}</span>
                {language.code === currentLanguage && <span className="check">✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="language-selector" ref={dropdownRef}>
      <div className="selector-header">
        <h3>{t('settings.language.selectLanguage')}</h3>
        <p>{t('Choose your preferred language for the interface')}</p>
      </div>

      <div className="current-language">
        <span className="label">{t('Current Language')}:</span>
        <div className="current-lang-display">
          {showFlag && <span className="flag large">{currentLang.flag}</span>}
          <div className="lang-info">
            <span className="name">{currentLang.name}</span>
            <span className="native-name">{currentLang.nativeName}</span>
          </div>
        </div>
      </div>

      <div className="auto-detect-section">
        <button 
          className="auto-detect-btn"
          onClick={handleAutoDetect}
          disabled={isChanging}
        >
          <span className="auto-icon">🌐</span>
          {t('settings.language.autoDetect')}
        </button>
      </div>

      <div className="languages-grid">
        {availableLanguages.map((language) => (
          <div
            key={language.code}
            className={`language-card ${language.code === currentLanguage ? 'selected' : ''} ${isChanging ? 'disabled' : ''}`}
            onClick={() => !isChanging && handleLanguageChange(language.code)}
          >
            <div className="card-header">
              <span className="flag large">{language.flag}</span>
              {language.code === currentLanguage && <span className="selected-badge">✓</span>}
            </div>
            <div className="card-content">
              <span className="lang-name">{language.name}</span>
              <span className="native-name">{language.nativeName}</span>
              <span className="lang-code">{language.code.toUpperCase()}</span>
            </div>
            {isChanging && language.code === currentLanguage && (
              <div className="changing-indicator">
                <span className="spinner">⟳</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="language-info">
        <h4>{t('Language Support Information')}</h4>
        <ul>
          <li>{t('Interface elements are translated automatically')}</li>
          <li>{t('Date and number formats adapt to your language')}</li>
          <li>{t('Right-to-left languages are fully supported')}</li>
          <li>{t('Language preference is saved locally')}</li>
        </ul>
      </div>
    </div>
  );
};

export default LanguageSelector;