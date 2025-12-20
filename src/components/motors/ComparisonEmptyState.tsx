import { useNavigate } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export function ComparisonEmptyState() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Scale className="text-primary" size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-3">
          No Motors to Compare
        </h1>
        
        <p className="text-muted-foreground mb-8">
          Add motors to your comparison list by clicking the scale icon on motor cards. 
          You can compare up to 3 motors side by side.
        </p>
        
        <Button 
          onClick={() => navigate('/quote/motor-selection')}
          size="lg"
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Browse Motors
        </Button>
      </motion.div>
    </div>
  );
}