/// <reference types="chrome" />
import React, { useState, useEffect } from 'react';
import './Switch.css';

const Switch = () => {
  const [checked, setChecked] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");

  const handleToggle = () => {
    setChecked(!checked);
  };

  useEffect(() => {
    // Fetch the highlighted text from Chrome storage
    chrome.storage.local.get("highlightedText", (result) => {
      if (result.highlightedText) {
        setHighlightedText(result.highlightedText);
      }
    });
  }, [checked]);

  return (
    <>
      <input
        className="react-switch-checkbox"
        id="react-switch-new"
        type="checkbox"
        checked={checked}
        onChange={handleToggle}
      />
      <label
        className="react-switch-label"
        htmlFor="react-switch-new"
        style={{ backgroundColor: checked ? 'green' : 'gray' }}
      >
        <span className="react-switch-button" />
      </label>
      
      {/* Display highlighted text in the extension popup */}
      {checked && highlightedText && (
        <div className="highlighted-text">
          <p>Highlighted Text:</p>
          <p>{highlightedText}</p>
        </div>
      )}
    </>
  );
};

export default Switch;
