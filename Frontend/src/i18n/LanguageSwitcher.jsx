import { useTranslation } from 'react-i18next';
import { changeLanguage } from './index';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <div style={styles.wrapper}>
      <button
        style={{ ...styles.btn, ...(current === 'en' ? styles.active : {}) }}
        onClick={() => changeLanguage('en')}
      >
        EN
      </button>
      <button
        style={{ ...styles.btn, ...(current === 'kn' ? styles.active : {}) }}
        onClick={() => changeLanguage('kn')}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  btn: {
    padding: '4px 12px',
    borderRadius: '20px',
    border: '1.5px solid #e2e8f0',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    transition: 'all 0.2s',
  },
  active: {
    background: '#1D4ED8',
    color: '#fff',
    border: '1.5px solid #1D4ED8',
  },
};
