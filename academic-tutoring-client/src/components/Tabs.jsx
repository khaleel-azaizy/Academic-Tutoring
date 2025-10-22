/**
 * Tabs Component
 * 
 * Reusable tab navigation component with animated pill indicator.
 * Supports both controlled and uncontrolled modes with smooth transitions.
 * 
 * Features:
 * - Animated pill indicator that follows active tab
 * - Controlled and uncontrolled modes
 * - Keyboard navigation support
 * - Smooth transitions and animations
 * - Responsive design
 * - Custom tab content rendering
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array} props.tabs - Array of tab objects with key, title, and content
 * @param {string} [props.initialKey] - Initial active tab key
 * @param {string} [props.activeKey] - Controlled active tab key
 * @param {Function} [props.onTabChange] - Tab change callback for controlled mode
 * @returns {JSX.Element} Tab navigation component
 */

import { useState, useEffect, useRef } from 'react';

const Tabs = ({ tabs, initialKey, activeKey, onTabChange }) => {
  // Extract tab keys for easier manipulation
  const keys = tabs.map(t => t.key);
  
  // State management for controlled/uncontrolled modes
  const [internalActive, setInternalActive] = useState(initialKey || keys[0]); // Internal state for uncontrolled mode
  const active = activeKey !== undefined ? activeKey : internalActive; // Current active tab
  const [activeIndex, setActiveIndex] = useState(0); // Index of active tab for pill positioning
  const tabsNavRef = useRef(null); // Reference to tabs navigation container
  const activeTab = tabs.find(t => t.key === active) || tabs[0]; // Currently active tab object

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
    if (activeKey !== undefined && onTabChange) {
      // Controlled mode - call parent's callback
      onTabChange(tabKey);
    } else {
      // Uncontrolled mode - manage internal state
      setInternalActive(tabKey);
    }
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


