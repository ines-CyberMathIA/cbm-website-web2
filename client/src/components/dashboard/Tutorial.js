import React from 'react';

const Tutorial = () => {
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Bienvenue dans votre espace parent !
      </h2>
      
      <div className="space-y-8">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Étape 1 : Ajoutez votre enfant</h3>
            <p className="mt-2 text-gray-600">
              Commencez par ajouter votre enfant en cliquant sur le bouton "Ajouter un enfant" dans le menu de gauche.
              Vous pourrez ensuite souscrire à un forfait adapté à ses besoins.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Étape 2 : Suivez ses progrès</h3>
            <p className="mt-2 text-gray-600">
              Une fois inscrit, accédez à son tableau de bord personnalisé pour suivre ses séances,
              consulter les comptes rendus et voir ses devoirs à venir.
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">Étape 3 : Gérez son planning</h3>
            <p className="mt-2 text-gray-600">
              Visualisez et gérez son emploi du temps, les séances à venir et les devoirs à rendre
              directement depuis son espace personnel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial; 