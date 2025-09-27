import { useState, useEffect, useRef } from 'react';

const Tabs = ({ tabs, initialKey }) => {
  const keys = tabs.map(t => t.key);
  const [active, setActive] = useState(initialKey || keys[0]);
  const [activeIndex, setActiveIndex] = useState(0);
  const tabsNavRef = useRef(null);
  const activeTab = tabs.find(t => t.key === active) || tabs[0];

  const updatePillPosition = (index) => {
    if (!tabsNavRef.current) return;
    
    // Get the actual tab button element
    const tabButtons = tabsNavRef.current.querySelectorAll('.tab-btn');
    const activeTab = tabButtons[index];
    
    if (!activeTab) return;
    
    // Get the actual dimensions
    const navRect = tabsNavRef.current.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    
    // Calculate relative position within the nav
    const left = tabRect.left - navRect.left;
    const width = tabRect.width;
    
    // Set CSS custom properties with actual pixel values
    tabsNavRef.current.style.setProperty('--pill-width', `${width}px`);
    tabsNavRef.current.style.setProperty('--pill-left', `${left}px`);
    tabsNavRef.current.setAttribute('data-active-index', index);
  };

  useEffect(() => {
    const currentIndex = keys.indexOf(active);
    setActiveIndex(currentIndex);
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      updatePillPosition(currentIndex);
    }, 0);
  }, [active, keys, tabs.length]);

  const handleTabClick = (tabKey, index) => {
    setActive(tabKey);
    setActiveIndex(index);
    updatePillPosition(index);
  };

  return (
    <div className="tabs">
      <div className="tabs-nav" ref={tabsNavRef}>
        {tabs.map((t, index) => (
          <button
            key={t.key}
            className={`tab-btn ${active === t.key ? 'active' : ''}`}
            onClick={() => handleTabClick(t.key, index)}
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


