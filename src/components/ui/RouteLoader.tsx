import harrisLogo from '@/assets/harris-logo.png';

export const RouteLoader = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <img 
        src={harrisLogo} 
        alt="Harris Boat Works" 
        className="h-14 md:h-16 opacity-90 animate-pulse mb-6"
      />
      <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-primary rounded-full animate-loading-bar" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground font-medium tracking-wide">Loading...</p>
    </div>
  );
};
