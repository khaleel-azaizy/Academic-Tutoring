import { useState } from 'react';

const Tabs = ({ tabs, initialKey }) => {
  const keys = tabs.map(t => t.key);
  const [active, setActive] = useState(initialKey || keys[0]);
  const activeTab = tabs.find(t => t.key === active) || tabs[0];

  return (
    <div className="tabs">
      <div className="tabs-nav">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`tab-btn ${active === t.key ? 'active' : ''}`}
            onClick={() => setActive(t.key)}
          >
            {t.title}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {activeTab && activeTab.content}
      </div>
    </div>
  );
};

export default Tabs;


