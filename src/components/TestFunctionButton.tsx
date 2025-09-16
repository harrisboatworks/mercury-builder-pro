import { Button } from "@/components/ui/button";

const TestFunctionButton = () => {
  const testFunction = async () => {
    try {
      console.log("🧪 Testing Mercury sync function...");
      
      const response = await fetch('https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-mercury-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log('📊 Function response:', data);
      alert(`Function test: ${data.success ? 'SUCCESS' : 'FAILED'}\nMessage: ${data.message || data.error}`);
      
    } catch (error) {
      console.error('❌ Function test failed:', error);
      alert(`Function test failed: ${error.message}`);
    }
  };

  return (
    <Button onClick={testFunction} className="bg-blue-500 hover:bg-blue-600 text-white">
      Test Mercury Sync
    </Button>
  );
};

export default TestFunctionButton;