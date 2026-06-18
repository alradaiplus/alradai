'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/src/core/supabase';

interface UserProfile {
  id: string;
  workspaceId: string;
  goals: string[];
  interests: string[];
  habits: string[];
  challenges: string[];
  preferences: Record<string, string>;
  interviewCompleted: boolean;
  lastUpdated: number;
}

interface InterviewQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiselect' | 'rating';
  options?: string[];
  key: keyof Omit<UserProfile, 'id' | 'workspaceId' | 'interviewCompleted' | 'lastUpdated'>;
}

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'goals',
    question: 'What are your main goals? (Select all that apply)',
    type: 'multiselect',
    options: [
      'Improve productivity',
      'Learn new skills',
      'Build better habits',
      'Organize thoughts',
      'Track progress',
      'Collaborate with others',
    ],
    key: 'goals',
  },
  {
    id: 'interests',
    question: 'What topics interest you most?',
    type: 'text',
    key: 'interests',
  },
  {
    id: 'habits',
    question: 'What habits would you like to track?',
    type: 'text',
    key: 'habits',
  },
  {
    id: 'challenges',
    question: 'What challenges do you face?',
    type: 'text',
    key: 'challenges',
  },
  {
    id: 'preferences',
    question: 'How often do you want AI suggestions?',
    type: 'multiselect',
    options: ['Daily', 'Weekly', 'Monthly', 'Never'],
    key: 'preferences',
  },
];

interface PersonalizedInterviewProps {
  workspaceId: string;
  onComplete?: (profile: UserProfile) => void;
}

export function PersonalizedInterview({ workspaceId, onComplete }: PersonalizedInterviewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    workspaceId,
    goals: [],
    interests: [],
    habits: [],
    challenges: [],
    preferences: {},
    interviewCompleted: false,
  });
  const [loading, setLoading] = useState(false);

  const currentQuestion = INTERVIEW_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / INTERVIEW_QUESTIONS.length) * 100;

  const handleAnswer = (value: string | string[]) => {
    const key = currentQuestion.key;
    
    setProfile(prev => ({
      ...prev,
      [key]: Array.isArray(value) ? value : [value],
    }));
  };

  const handleNext = async () => {
    if (currentStep < INTERVIEW_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save profile
      setLoading(true);
      try {
        const completeProfile: UserProfile = {
          id: `profile_${Date.now()}`,
          workspaceId,
          goals: profile.goals || [],
          interests: profile.interests || [],
          habits: profile.habits || [],
          challenges: profile.challenges || [],
          preferences: profile.preferences || {},
          interviewCompleted: true,
          lastUpdated: Date.now(),
        };

        const { error } = await supabase
          .from('user_profiles')
          .upsert([{
            id: completeProfile.id,
            workspace_id: workspaceId,
            goals: completeProfile.goals,
            interests: completeProfile.interests,
            habits: completeProfile.habits,
            challenges: completeProfile.challenges,
            preferences: completeProfile.preferences,
            interview_completed: true,
            last_updated: new Date().toISOString(),
          }]);

        if (!error) {
          onComplete?.(completeProfile);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Let's Get to Know You</h1>
          <p className="text-slate-300">
            Answer a few questions so AI can personalize your experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">
              Question {currentStep + 1} of {INTERVIEW_QUESTIONS.length}
            </span>
            <span className="text-sm font-semibold text-blue-400">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>

          {currentQuestion.type === 'multiselect' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map(option => (
                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={(profile[currentQuestion.key] as string[])?.includes(option) || false}
                    onChange={(e) => {
                      const current = (profile[currentQuestion.key] as string[]) || [];
                      if (e.target.checked) {
                        handleAnswer([...current, option]);
                      } else {
                        handleAnswer(current.filter(item => item !== option));
                      }
                    }}
                    className="w-5 h-5 rounded border-2 border-slate-500 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-lg group-hover:text-blue-400 transition">{option}</span>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <textarea
              value={(profile[currentQuestion.key] as string[])?.[0] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 bg-slate-600 rounded-lg border border-slate-500 focus:border-blue-500 outline-none transition resize-none"
              rows={4}
            />
          )}

          {currentQuestion.type === 'rating' && (
            <div className="flex gap-4 justify-center">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => handleAnswer(String(rating))}
                  className={`w-12 h-12 rounded-full font-bold text-lg transition ${
                    (profile[currentQuestion.key] as string[])?.[0] === String(rating)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-slate-500 rounded-lg hover:bg-slate-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Saving...' : currentStep === INTERVIEW_QUESTIONS.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-6">
          <button className="text-slate-400 hover:text-slate-300 transition">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
