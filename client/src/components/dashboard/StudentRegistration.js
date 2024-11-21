import React, { useState } from 'react';
import { motion } from 'framer-motion';
import StudentInfoStep from './registration/StudentInfoStep';
import PlanSelectionStep from './registration/PlanSelectionStep';

const StudentRegistration = () => {
  const [step, setStep] = useState(1);
  const [studentData, setStudentData] = useState({
    firstName: '',
    lastName: '',
    level: '',
    email: '',
    plan: null,
    engagement: null,
    subject: null
  });

  const handleStudentInfoSubmit = (data) => {
    setStudentData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const handlePlanSelection = (planData) => {
    setStudentData(prev => ({ ...prev, ...planData }));
    // Passer à l'étape suivante ou finaliser l'inscription
    console.log('Données complètes:', studentData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className="ml-2 text-sm font-medium">Informations de l'élève</div>
            </div>
            <div className="flex-1 mx-4 h-1 bg-gray-200">
              <div className={`h-full bg-indigo-600 transition-all duration-500 ${
                step > 1 ? 'w-full' : 'w-0'
              }`} />
            </div>
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className="ml-2 text-sm font-medium">Choix du forfait</div>
            </div>
          </div>
        </div>

        {/* Contenu des étapes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {step === 1 && (
            <StudentInfoStep 
              initialData={studentData}
              onSubmit={handleStudentInfoSubmit}
            />
          )}
          {step === 2 && (
            <PlanSelectionStep
              initialData={studentData}
              onSubmit={handlePlanSelection}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StudentRegistration; 