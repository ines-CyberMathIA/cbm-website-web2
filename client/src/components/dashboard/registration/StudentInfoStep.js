import React, { useState } from 'react';
import { motion } from 'framer-motion';

const StudentInfoStep = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    level: initialData.level || '',
    email: initialData.email || ''
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.level) newErrors.level = 'La classe est requise';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Informations de l'élève
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prénom
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              } focus:border-indigo-500 focus:ring-indigo-500`}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              } focus:border-indigo-500 focus:ring-indigo-500`}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Classe
          </label>
          <select
            value={formData.level}
            onChange={(e) => setFormData({...formData, level: e.target.value})}
            className={`mt-1 block w-full rounded-md shadow-sm ${
              errors.level ? 'border-red-300' : 'border-gray-300'
            } focus:border-indigo-500 focus:ring-indigo-500`}
          >
            <option value="">Sélectionnez une classe</option>
            <option value="6">6ème</option>
            <option value="5">5ème</option>
            <option value="4">4ème</option>
            <option value="3">3ème</option>
            <option value="2">Seconde</option>
            <option value="1">Première</option>
            <option value="T">Terminale</option>
          </select>
          {errors.level && (
            <p className="mt-1 text-sm text-red-600">{errors.level}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email (optionnel)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Continuer
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default StudentInfoStep; 