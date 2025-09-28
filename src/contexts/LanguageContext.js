import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');
  const [isRTL, setIsRTL] = useState(false);

  // Supported languages configuration
  const supportedLanguages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      rtl: false
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      rtl: false
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      rtl: false
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      rtl: false
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
      rtl: false
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      rtl: false
    },
    {
      code: 'ar',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      rtl: true
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      flag: '🇮🇳',
      rtl: false
    },
    {
      code: 'pt',
      name: 'Portuguese',
      nativeName: 'Português',
      flag: '🇵🇹',
      rtl: false
    },
    {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский',
      flag: '🇷🇺',
      rtl: false
    }
  ];

  // RTL languages
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
      setIsRTL(rtlLanguages.includes(lng));
      
      // Update document direction
      document.documentElement.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
      
      // Store language preference
      localStorage.setItem('selectedLanguage', lng);
    };

    // Set initial language
    handleLanguageChange(i18n.language);

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      
      // Trigger custom event for other components to react
      window.dispatchEvent(new CustomEvent('languageChange', {
        detail: { language: languageCode }
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to change language:', error);
      return false;
    }
  };

  const getCurrentLanguage = () => {
    return supportedLanguages.find(lang => lang.code === currentLanguage) || supportedLanguages[0];
  };

  const getAvailableLanguages = () => {
    return supportedLanguages;
  };

  const isLanguageSupported = (languageCode) => {
    return supportedLanguages.some(lang => lang.code === languageCode);
  };

  const detectBrowserLanguage = () => {
    const browserLang = navigator.language || navigator.languages[0];
    const langCode = browserLang.split('-')[0];
    return isLanguageSupported(langCode) ? langCode : 'en';
  };

  const setAutoDetectedLanguage = () => {
    const detectedLang = detectBrowserLanguage();
    if (detectedLang !== currentLanguage) {
      changeLanguage(detectedLang);
    }
  };

  // Format numbers according to current language
  const formatNumber = (number, options = {}) => {
    return new Intl.NumberFormat(currentLanguage, options).format(number);
  };

  // Format dates according to current language
  const formatDate = (date, options = {}) => {
    return new Intl.DateTimeFormat(currentLanguage, options).format(new Date(date));
  };

  // Format currency according to current language
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Get localized content direction classes
  const getDirectionClasses = () => {
    return {
      text: isRTL ? 'text-right' : 'text-left',
      margin: isRTL ? 'ml-auto mr-0' : 'mr-auto ml-0',
      padding: isRTL ? 'pl-4 pr-0' : 'pr-4 pl-0',
      float: isRTL ? 'float-right' : 'float-left',
      border: isRTL ? 'border-r' : 'border-l'
    };
  };

  // Get translated validation messages
  const getValidationMessage = (field, rule, value) => {
    const messages = {
      required: i18n.t(`validation.${field}.required`, `${field} is required`),
      minLength: i18n.t(`validation.${field}.minLength`, `${field} must be at least ${value} characters`),
      maxLength: i18n.t(`validation.${field}.maxLength`, `${field} must be no more than ${value} characters`),
      email: i18n.t(`validation.${field}.email`, 'Please enter a valid email address'),
      pattern: i18n.t(`validation.${field}.pattern`, `${field} format is invalid`)
    };
    return messages[rule] || `${field} is invalid`;
  };

  // Load additional translations dynamically
  const loadNamespaceTranslations = async (namespace, language = currentLanguage) => {
    try {
      const translations = await import(`../translations/${language}/${namespace}.json`);
      i18n.addResourceBundle(language, namespace, translations.default, true, true);
      return true;
    } catch (error) {
      console.warn(`Failed to load translations for ${namespace}:${language}`, error);
      return false;
    }
  };

  // Get pluralization rules for current language
  const getPlural = (count, singular, plural) => {
    return i18n.t(singular, { count, defaultValue_plural: plural });
  };

  const contextValue = {
    currentLanguage,
    isRTL,
    supportedLanguages,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    isLanguageSupported,
    detectBrowserLanguage,
    setAutoDetectedLanguage,
    formatNumber,
    formatDate,
    formatCurrency,
    getDirectionClasses,
    getValidationMessage,
    loadNamespaceTranslations,
    getPlural
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};