interface GoogleMapEmbedProps {
  className?: string;
  height?: string;
  center?: {
    latitude: number;
    longitude: number;
  };
}

export function GoogleMapEmbed({ className = '', height = '100%', center }: GoogleMapEmbedProps) {
  const apiKey = 'AIzaSyCUrKdC-eiCSlmq2TK0I2JqcXPQxTV-9VY';
  const embedUrl = center
    ? `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center.latitude},${center.longitude}&zoom=14&maptype=roadmap`
    : `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=Harris+Boat+Works,Gores+Landing,ON&zoom=14`;

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
