import React from 'react';
import { motion } from 'framer-motion';

const StatesProgress = ({ visitedStates = [], totalStates = 48 }) => {
  const completionPercentage = (visitedStates.length / totalStates) * 100;
  const remainingStates = totalStates - visitedStates.length;

  return (
    <div className="space-y-4">
      {/* Progress Circle */}
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            className="text-gray-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
          />
          {/* Progress circle */}
          <motion.circle
            className="text-blue-500"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="42"
            cx="50"
            cy="50"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: completionPercentage / 100 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl font-bold">{Math.round(completionPercentage)}%</span>
            <p className="text-sm">Complete</p>
          </div>
        </div>
      </div>

      {/* States Summary */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="text-lg font-semibold">{visitedStates.length}</h4>
          <p className="text-sm text-gray-300">States Visited</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="text-lg font-semibold">{remainingStates}</h4>
          <p className="text-sm text-gray-300">States Remaining</p>
        </div>
      </div>

      {/* States List */}
      <div className="mt-4">
        <h4 className="text-sm font-semibold mb-2">Recently Visited</h4>
        <div className="space-y-2">
          {visitedStates.slice(-3).reverse().map(state => (
            <div 
              key={state.name}
              className="bg-white/5 rounded-lg p-2 flex justify-between items-center"
            >
              <span>{state.name}</span>
              <span className="text-sm text-gray-400">
                {new Date(state.visitDate).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatesProgress;
