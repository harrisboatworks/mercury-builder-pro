import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PremiumShell from '@/components/layout/PremiumShell';
import StepHeader from '@/components/ui/StepHeader';
import BoatTypeSelector from '@/components/ui/BoatTypeSelector';
import PhotoUpload from '@/components/ui/PhotoUpload';
import { useQuote } from '@/contexts/QuoteContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BoatInfo } from '@/components/QuoteBuilder';

export default function BoatInfoPage() {
  const navigate = useNavigate();
  const { state, dispatch, isStepAccessible, isNavigationBlocked } = useQuote();

  // Calculate fit confidence based on completed fields
  const fitConfidence = useMemo(() => {
    const fields = ['boatType', 'boatLengthFt', 'transomHeight'];
    const completed = fields.filter(field => {
      const value = state.ui.intake[field as keyof typeof state.ui.intake];
      return value !== null && value !== undefined && value !== '';
    }).length;
    return (completed / fields.length) * 100;
  }, [state.ui.intake]);

  useEffect(() => {
    // Add delay to prevent navigation during state updates
    const checkAccessibility = () => {
      // Only navigate if we're not in loading state, not navigation blocked, and have a valid motor selected
      if (!state.isLoading && !isNavigationBlocked && state.motor && !isStepAccessible(3)) {
        navigate('/quote/motor-selection');
        return;
      }
    };

    // Standardized delay to 500ms to match other pages
    const timeoutId = setTimeout(checkAccessibility, 500);

    document.title = 'Boat Information | Harris Boat Works';
    
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = 'Provide your boat details for accurate motor compatibility and installation requirements.';

    return () => clearTimeout(timeoutId);
  }, [state.isLoading, isStepAccessible, isNavigationBlocked, navigate]);

  const handleStepComplete = (boatInfo: BoatInfo) => {
    dispatch({ type: 'SET_BOAT_INFO', payload: boatInfo });
    dispatch({ type: 'COMPLETE_STEP', payload: 3 });
    navigate('/quote/trade-in');
  };

  const handleBack = () => {
    navigate('/quote/purchase-path');
  };

  const handleShowCompatibleMotors = () => {
    navigate('/quote/motor-selection');
  };

  return (
    <PremiumShell 
      title="Configure your boat"
      subtitle="Give a few details or photos; we verify before billing."
    >
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Purchase Path
        </Button>
      </div>

      <StepHeader 
        label="Boat Details" 
        help="Accurate boat information ensures proper motor compatibility and installation."
      >
        <div className="text-sm p-quiet">
          We'll verify compatibility before finalizing your quote. Have questions about boat specifications? Our team can help.
        </div>
      </StepHeader>
      
      {/* Boat Type */}
      <div className="p-card bg-white dark:bg-slate-900 p-5 space-y-4">
        <StepHeader label="Boat Type" help="Select your boat type for accurate motor recommendations." />
        <BoatTypeSelector
          selectedType={state.ui.intake.boatType}
          onTypeSelect={(type) => dispatch({ type: 'SET_INTAKE_FIELD', payload: { key: 'boatType', value: type } })}
          onNotSure={() => dispatch({ type: 'SET_INTAKE_UNKNOWN', payload: { key: 'boatType', value: true } })}
        />
      </div>

      {/* Boat Length */}
      <div className="p-card bg-white dark:bg-slate-900 p-5 space-y-4">
        <StepHeader label="Boat Length" help="Length affects motor power requirements." />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="Enter length"
              value={state.ui.intake.boatLengthFt || ''}
              onChange={(e) => dispatch({ 
                type: 'SET_INTAKE_FIELD', 
                payload: { key: 'boatLengthFt', value: e.target.value ? Number(e.target.value) : null } 
              })}
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
            />
            <span className="text-sm p-quiet">feet</span>
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_INTAKE_UNKNOWN', payload: { key: 'boatLengthFt', value: true } })}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            I'm not sure
          </button>
        </div>
      </div>

      {/* Transom Height */}
      <div className="p-card bg-white dark:bg-slate-900 p-5 space-y-4">
        <StepHeader label="Transom Height" help="Motor shaft length depends on transom height." />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {['15', '20', '25', '30'].map((height) => (
              <button
                key={height}
                onClick={() => dispatch({ type: 'SET_INTAKE_FIELD', payload: { key: 'transomHeight', value: height } })}
                className={`px-4 py-2 text-sm rounded-full border transition-all ${
                  state.ui.intake.transomHeight === height
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {height}"
              </button>
            ))}
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_INTAKE_UNKNOWN', payload: { key: 'transomHeight', value: true } })}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            I'm not sure
          </button>
        </div>
      </div>

      {/* Steering */}
      <div className="p-card bg-white dark:bg-slate-900 p-5 space-y-4">
        <StepHeader label="Steering System" help="Current steering affects installation requirements." />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tiller', label: 'Tiller' },
              { id: 'cable', label: 'Cable' },
              { id: 'hydraulic', label: 'Hydraulic' },
              { id: 'none', label: 'None' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => dispatch({ type: 'SET_INTAKE_FIELD', payload: { key: 'steering', value: option.id } })}
                className={`px-4 py-2 text-sm rounded-full border transition-all ${
                  state.ui.intake.steering === option.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_INTAKE_UNKNOWN', payload: { key: 'steering', value: true } })}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            I'm not sure
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-card bg-white dark:bg-slate-900 p-5 space-y-4">
        <StepHeader label="Control Type" help="Control system affects motor compatibility." />
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tiller', label: 'Tiller' },
              { id: 'side', label: 'Side Mount' },
              { id: 'binnacle', label: 'Binnacle' },
              { id: 'dts', label: 'DTS Digital' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => dispatch({ type: 'SET_INTAKE_FIELD', payload: { key: 'controls', value: option.id } })}
                className={`px-4 py-2 text-sm rounded-full border transition-all ${
                  state.ui.intake.controls === option.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => dispatch({ type: 'SET_INTAKE_UNKNOWN', payload: { key: 'controls', value: true } })}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            I'm not sure
          </button>
        </div>
      </div>

      {/* Photos */}
      <div className="p-card bg-white dark:bg-slate-900 p-5 space-y-4">
        <StepHeader label="Photos (Optional)" help="Photos help us verify compatibility before billing." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PhotoUpload
            label="Transom"
            photo={state.ui.intake.photos?.transom || null}
            onPhotoChange={(dataUrl) => dispatch({ type: 'SET_INTAKE_PHOTO', payload: { key: 'transom', dataUrl } })}
          />
          <PhotoUpload
            label="Helm/Console"
            photo={state.ui.intake.photos?.helm || null}
            onPhotoChange={(dataUrl) => dispatch({ type: 'SET_INTAKE_PHOTO', payload: { key: 'helm', dataUrl } })}
          />
          <PhotoUpload
            label="Data Plate/Serial"
            photo={state.ui.intake.photos?.dataplate || null}
            onPhotoChange={(dataUrl) => dispatch({ type: 'SET_INTAKE_PHOTO', payload: { key: 'dataplate', dataUrl } })}
          />
        </div>
      </div>

      {/* Fit Confidence */}
      <div className="p-card bg-white dark:bg-slate-900 p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Fit Confidence</span>
            <span className="text-sm p-quiet">{Math.round(fitConfidence)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${fitConfidence}%` }}
            />
          </div>
          <div className="text-xs p-quiet">
            We verify compatibility before billing.
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <Button onClick={() => handleStepComplete({} as BoatInfo)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium">
        Continue to Trade-In
      </Button>
    </PremiumShell>
  );
}