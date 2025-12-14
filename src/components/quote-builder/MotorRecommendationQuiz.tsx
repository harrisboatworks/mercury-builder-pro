import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, Lightbulb, Ship, Activity, Ruler, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuizAnswers {
  boatType: string;
  usage: string;
  boatLength: string;
  budget: string;
}

interface RecommendedMotor {
  id: string;
  model: string;
  hp: number;
  price: number;
  reason: string;
  imageUrl?: string;
}

interface MotorRecommendationQuizProps {
  isOpen: boolean;
  onClose: () => void;
  motors: any[];
  onSelectMotor: (motor: any) => void;
}

const quizSteps = [
  {
    id: 'boatType',
    title: 'What type of boat do you have?',
    icon: Ship,
    options: [
      { value: 'fishing', label: 'Fishing boat' },
      { value: 'pontoon', label: 'Pontoon' },
      { value: 'inflatable', label: 'Inflatable/Dinghy' },
      { value: 'jon', label: 'Jon boat' },
      { value: 'other', label: 'Other' }
    ]
  },
  {
    id: 'usage',
    title: 'How will you use it?',
    icon: Activity,
    options: [
      { value: 'cruising', label: 'Recreational cruising' },
      { value: 'fishing', label: 'Fishing' },
      { value: 'watersports', label: 'Watersports' },
      { value: 'commercial', label: 'Commercial use' }
    ]
  },
  {
    id: 'boatLength',
    title: "What's your boat length?",
    icon: Ruler,
    options: [
      { value: 'under12', label: 'Under 12ft' },
      { value: '12-16', label: '12-16ft' },
      { value: '16-20', label: '16-20ft' },
      { value: 'over20', label: 'Over 20ft' }
    ]
  },
  {
    id: 'budget',
    title: "What's your budget?",
    icon: DollarSign,
    options: [
      { value: 'under2k', label: 'Under $2,000' },
      { value: '2k-4k', label: '$2,000-$4,000' },
      { value: '4k-6k', label: '$4,000-$6,000' },
      { value: 'over6k', label: 'Over $6,000' }
    ]
  }
];

export function MotorRecommendationQuiz({ isOpen, onClose, motors, onSelectMotor }: MotorRecommendationQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [recommendations, setRecommendations] = useState<RecommendedMotor[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (stepId: string, value: string) => {
    const newAnswers = { ...answers, [stepId]: value };
    setAnswers(newAnswers);

    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Generate recommendations
      const recs = generateRecommendations(newAnswers as QuizAnswers, motors);
      setRecommendations(recs);
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (showResults) {
      setShowResults(false);
      setCurrentStep(quizSteps.length - 1);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setRecommendations([]);
    setShowResults(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSelectMotor = (motor: any) => {
    onSelectMotor(motor);
    handleClose();
  };

  const currentQuizStep = quizSteps[currentStep];
  const StepIcon = currentQuizStep?.icon;

  const handleDragEnd = (_: any, info: { offset: { y: number } }) => {
    if (info.offset.y > 100) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          {/* Drag handle for mobile */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 cursor-grab md:hidden" />
          
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-light tracking-wide text-black">
              <Lightbulb className="w-5 h-5 text-gray-600" />
              Find Your Perfect Motor
            </DialogTitle>
          </DialogHeader>

        {!showResults && currentQuizStep ? (
          <div className="space-y-6 py-4">
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              {quizSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    idx <= currentStep ? 'bg-black' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Question */}
            <div className="text-center space-y-2">
              {StepIcon && <StepIcon className="w-12 h-12 mx-auto text-gray-600" />}
              <h3 className="text-2xl font-light tracking-wide text-black">{currentQuizStep.title}</h3>
              <p className="text-sm uppercase tracking-widest text-gray-500">
                Step {currentStep + 1} of {quizSteps.length}
              </p>
            </div>

            {/* Options */}
            <div className="grid gap-3">
              {currentQuizStep.options?.map((option) => (
                <Card
                  key={option.value}
                  className={`p-4 cursor-pointer transition-all hover:border-black hover:shadow-md ${
                    answers[currentQuizStep.id as keyof QuizAnswers] === option.value
                      ? 'border-black bg-stone-50'
                      : ''
                  }`}
                  onClick={() => handleAnswer(currentQuizStep.id, option.value)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-normal tracking-wide">{option.label}</span>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </Card>
              ))}
            </div>

            {/* Navigation */}
            {currentStep > 0 && (
              <div className="flex justify-start">
                <Button variant="ghost" onClick={handleBack} className="font-light text-gray-600 hover:text-black">
                  ← Back
                </Button>
              </div>
            )}
          </div>
        ) : showResults ? (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-light tracking-wide text-black">Your Recommended Motors</h3>
              <p className="text-sm text-muted-foreground">
                Based on your answers, here are our top picks for you
              </p>
            </div>

            <div className="space-y-4">
              {recommendations.map((motor, idx) => (
                <Card key={motor.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    {motor.imageUrl && (
                      <img
                        src={motor.imageUrl}
                        alt={motor.model}
                        className="w-24 h-24 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {idx === 0 && (
                              <span className="px-2 py-0.5 bg-black text-white text-xs rounded uppercase tracking-wider">
                                Top Pick
                              </span>
                            )}
                            <h4 className="font-medium tracking-wide text-lg">{motor.model}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{motor.hp}HP</p>
                        </div>
                        <span className="text-lg font-semibold text-black">
                          ${motor.price.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-stone-50 border-l-2 border-gray-300 p-3 rounded">
                        <p className="text-sm">
                          <span className="font-medium">Why we recommend this:</span> {motor.reason}
                        </p>
                      </div>
                      <Button
                        className="w-full bg-black text-white font-light tracking-wider uppercase rounded-none hover:bg-gray-900"
                        onClick={() => handleSelectMotor(motor)}
                      >
                        Select This Motor
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleBack} className="flex-1 border-black text-black hover:bg-stone-50">
                ← Back to Quiz
              </Button>
              <Button variant="ghost" onClick={handleClose} className="flex-1 font-light text-gray-600 hover:text-black hover:bg-transparent">
                Browse All Motors
              </Button>
            </div>
          </div>
        ) : null}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function generateRecommendations(answers: QuizAnswers, motors: any[]): RecommendedMotor[] {
  // HP range mapping
  const hpRanges: Record<string, { min: number; max: number }> = {
    'under12': { min: 2.5, max: 20 },
    '12-16': { min: 15, max: 60 },
    '16-20': { min: 40, max: 150 },
    'over20': { min: 90, max: 600 }
  };

  // Budget mapping
  const budgetRanges: Record<string, { min: number; max: number }> = {
    'under2k': { min: 0, max: 2000 },
    '2k-4k': { min: 2000, max: 4000 },
    '4k-6k': { min: 4000, max: 6000 },
    'over6k': { min: 6000, max: 999999 }
  };

  const hpRange = hpRanges[answers.boatLength];
  const budgetRange = budgetRanges[answers.budget];

  // Filter motors
  let filtered = motors.filter(motor => {
    const hp = motor.horsepower || motor.hp || 0;
    const price = motor.dealer_price || motor.msrp || 0;
    
    return (
      hp >= hpRange.min &&
      hp <= hpRange.max &&
      price >= budgetRange.min &&
      price <= budgetRange.max &&
      motor.in_stock
    );
  });

  // If no in-stock motors, expand to all motors
  if (filtered.length === 0) {
    filtered = motors.filter(motor => {
      const hp = motor.horsepower || motor.hp || 0;
      const price = motor.dealer_price || motor.msrp || 0;
      
      return (
        hp >= hpRange.min &&
        hp <= hpRange.max &&
        price >= budgetRange.min &&
        price <= budgetRange.max
      );
    });
  }

  // Sort by relevance (preference for mid-range of recommended HP)
  const midHp = (hpRange.min + hpRange.max) / 2;
  filtered.sort((a, b) => {
    const aHp = a.horsepower || a.hp || 0;
    const bHp = b.horsepower || b.hp || 0;
    return Math.abs(aHp - midHp) - Math.abs(bHp - midHp);
  });

  // Take top 3
  const topMotors = filtered.slice(0, 3);

  // Generate reasons
  return topMotors.map((motor, idx) => {
    const hp = motor.horsepower || motor.hp || 0;
    const reason = generateReason(answers, motor, idx, hpRange);

    return {
      id: motor.id,
      model: motor.display_name || motor.model || 'Mercury Motor',
      hp,
      price: motor.dealer_price || motor.msrp || 0,
      reason,
      imageUrl: motor.hero_image_url || motor.image_url,
      ...motor
    };
  });
}

function generateReason(answers: QuizAnswers, motor: any, rank: number, hpRange: any): string {
  const hp = motor.horsepower || motor.hp || 0;
  const reasons = [];

  // Boat type specific
  if (answers.boatType === 'fishing') {
    reasons.push('Reliable performance for long fishing days');
  } else if (answers.boatType === 'pontoon') {
    reasons.push('Perfect for smooth, stable cruising');
  } else if (answers.boatType === 'inflatable') {
    reasons.push('Lightweight and easy to handle');
  }

  // Usage specific
  if (answers.usage === 'watersports') {
    reasons.push('provides quick acceleration for towing');
  } else if (answers.usage === 'commercial') {
    reasons.push('built for durability and heavy-duty use');
  } else if (answers.usage === 'cruising') {
    reasons.push('fuel-efficient for extended trips');
  }

  // HP positioning
  const midHp = (hpRange.min + hpRange.max) / 2;
  if (hp < midHp * 0.8) {
    reasons.push('and offers excellent fuel economy');
  } else if (hp > midHp * 1.2) {
    reasons.push('and delivers maximum power');
  } else {
    reasons.push('with a perfect balance of power and efficiency');
  }

  // Stock status
  if (motor.in_stock) {
    reasons.push('Available now for immediate delivery!');
  }

  return `This ${hp}HP motor ${reasons.join(', ')}.`;
}
