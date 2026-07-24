import React from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: '→ / Right Arrow', action: 'Next commit step' },
    { key: '← / Left Arrow', action: 'Previous commit step' },
    { key: 'Home / End', action: 'First / Last commit step' },
    { key: 'S', action: 'Toggle Split / Inline / Single View mode' },
    { key: '?', action: 'Toggle Keyboard Shortcuts Modal' },
    { key: 'Esc', action: 'Close active modal' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <HelpCircle size={20} className="text-accent-blue" />
            <h2>Keyboard Shortcuts</h2>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <table className="shortcuts-table">
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((sc, idx) => (
                <tr key={idx}>
                  <td><kbd>{sc.key}</kbd></td>
                  <td>{sc.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
