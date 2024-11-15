import React from 'react';

const ChildDashboard = ({ child }) => {
  return (
    <div className="space-y-6">
      {/* En-tête du dashboard */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard de {child.firstName}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Niveau : {child.schoolLevel}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Progression</h3>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">75%</p>
          <p className="mt-1 text-sm text-gray-500">du programme complété</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Temps d'étude</h3>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">12h</p>
          <p className="mt-1 text-sm text-gray-500">cette semaine</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900">Exercices</h3>
          <p className="mt-2 text-3xl font-semibold text-indigo-600">45</p>
          <p className="mt-1 text-sm text-gray-500">complétés</p>
        </div>
      </div>

      {/* Prochaines sessions */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Prochaines sessions
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Mathématiques</p>
              <p className="text-sm text-gray-500">Chapitre 5 : Géométrie</p>
            </div>
            <p className="text-sm text-gray-500">Demain, 14:00</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Informatique</p>
              <p className="text-sm text-gray-500">Introduction à Python</p>
            </div>
            <p className="text-sm text-gray-500">Jeudi, 16:00</p>
          </div>
        </div>
      </div>

      {/* Derniers résultats */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Derniers résultats
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Test de mathématiques</p>
              <p className="text-sm text-gray-500">Algèbre - Niveau 2</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              18/20
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Quiz d'informatique</p>
              <p className="text-sm text-gray-500">Variables et types</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              15/20
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard; 