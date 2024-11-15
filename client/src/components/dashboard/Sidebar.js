import React from 'react';

const Sidebar = ({ children, activeSection, onSectionChange }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Bouton Ajouter un enfant */}
        <button
          onClick={() => onSectionChange('addChild')}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
          </svg>
          Ajouter un enfant
        </button>

        {/* Liste des enfants */}
        {children.length > 0 && (
          <div className="mt-6">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Mes enfants
            </h3>
            <div className="mt-2 space-y-1">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => onSectionChange(child.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${
                    activeSection === child.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="truncate">{child.firstName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tutoriel */}
        <button
          onClick={() => onSectionChange('tutorial')}
          className={`w-full mt-6 flex items-center px-3 py-2 text-sm rounded-md ${
            activeSection === 'tutorial'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Tutoriel
        </button>
      </div>
    </div>
  );
};

export default Sidebar;