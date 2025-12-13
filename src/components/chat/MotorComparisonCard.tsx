import React from 'react';
import { Check, Minus, TrendingUp, Fuel, Weight, DollarSign } from 'lucide-react';

interface MotorSpec {
  model: string;
  hp: number;
  price: number;
  weight?: number;
  fuelConsumption?: string;
  bestFor?: string;
}

interface MotorComparisonCardProps {
  motor1: MotorSpec;
  motor2: MotorSpec;
  recommendation?: string;
}

export const MotorComparisonCard: React.FC<MotorComparisonCardProps> = ({
  motor1,
  motor2,
  recommendation
}) => {
  const compareValue = (val1: number, val2: number, lowerIsBetter = false) => {
    if (val1 === val2) return 'equal';
    if (lowerIsBetter) return val1 < val2 ? 'winner' : 'loser';
    return val1 > val2 ? 'winner' : 'loser';
  };

  const priceComparison = compareValue(motor1.price, motor2.price, true);
  const hpComparison = compareValue(motor1.hp, motor2.hp, false);

  const StatusIcon = ({ status }: { status: 'winner' | 'loser' | 'equal' }) => {
    if (status === 'winner') return <Check className="w-4 h-4 text-green-600" />;
    if (status === 'equal') return <Minus className="w-4 h-4 text-gray-400" />;
    return null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(price);
  };

  const priceDifference = Math.abs(motor2.price - motor1.price);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden my-3">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 text-center">
          {motor1.hp}HP vs {motor2.hp}HP Comparison
        </h4>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-2 divide-x divide-gray-200">
        {/* Motor 1 Column */}
        <div className="p-4 space-y-3">
          <div className="text-center">
            <p className="font-medium text-gray-900">{motor1.hp}HP FourStroke</p>
            <p className="text-sm text-gray-500 truncate">{motor1.model}</p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Price</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{formatPrice(motor1.price)}</span>
              <StatusIcon status={priceComparison} />
            </div>
          </div>

          {/* Power */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Power</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{motor1.hp}HP</span>
              <StatusIcon status={hpComparison} />
            </div>
          </div>

          {motor1.weight && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Weight className="w-4 h-4" />
                <span className="text-sm">Weight</span>
              </div>
              <span className="font-medium text-sm">{motor1.weight} lbs</span>
            </div>
          )}

          {motor1.bestFor && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">Best for:</p>
              <p className="text-sm text-gray-700">{motor1.bestFor}</p>
            </div>
          )}
        </div>

        {/* Motor 2 Column */}
        <div className="p-4 space-y-3">
          <div className="text-center">
            <p className="font-medium text-gray-900">{motor2.hp}HP FourStroke</p>
            <p className="text-sm text-gray-500 truncate">{motor2.model}</p>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Price</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{formatPrice(motor2.price)}</span>
              <StatusIcon status={priceComparison === 'winner' ? 'loser' : priceComparison === 'loser' ? 'winner' : 'equal'} />
            </div>
          </div>

          {/* Power */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Power</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-sm">{motor2.hp}HP</span>
              <StatusIcon status={hpComparison === 'winner' ? 'loser' : hpComparison === 'loser' ? 'winner' : 'equal'} />
            </div>
          </div>

          {motor2.weight && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Weight className="w-4 h-4" />
                <span className="text-sm">Weight</span>
              </div>
              <span className="font-medium text-sm">{motor2.weight} lbs</span>
            </div>
          )}

          {motor2.bestFor && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">Best for:</p>
              <p className="text-sm text-gray-700">{motor2.bestFor}</p>
            </div>
          )}
        </div>
      </div>

      {/* Price Difference */}
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Price difference: <span className="font-medium">{formatPrice(priceDifference)}</span>
        </p>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="bg-amber-50 px-4 py-3 border-t border-amber-100">
          <p className="text-sm text-amber-800">
            <span className="font-medium">💡 Recommendation:</span> {recommendation}
          </p>
        </div>
      )}
    </div>
  );
};

export default MotorComparisonCard;
