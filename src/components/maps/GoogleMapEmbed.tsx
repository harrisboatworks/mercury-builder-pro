interface GoogleMapEmbedProps {
  className?: string;
  height?: string;
}

export function GoogleMapEmbed({ className = '', height = '100%' }: GoogleMapEmbedProps) {
  // Using a proper embed URL for Harris Boat Works location
  // Coordinates: 44.1167, -78.25 (approximate for Gores Landing area)
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyCUrKdC-eiCSlmq2TK0I2JqcXPQxTV-9VY&q=Harris+Boat+Works,Gores+Landing,ON&zoom=14`;

  return (
    <div className={`relative overflow-hidden rounded-xl bg-muted ${className}`} style={{ height }}>
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Harris Boat Works Location"
        className="absolute inset-0"
      />
    </div>
  );
}
