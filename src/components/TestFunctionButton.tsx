import { Button } from "@/components/ui/button";

const TestFunctionButton = () => {
  const testFunction = async () => {
    try {
      console.log("🧪 Testing scrape function...");
      
      const response = await fetch('https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-inventory-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pages_to_scrape: 1 })
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
      Test Scrape Function
    </Button>
  );
};

export default TestFunctionButton;