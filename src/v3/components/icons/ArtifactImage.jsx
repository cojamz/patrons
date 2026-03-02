/**
 * ArtifactImage — Renders generated artifact artwork with SVG fallback.
 *
 * Uses Nano Banana-generated PNGs from assets/artifacts/.
 * Falls back to CardPixelIcon SVG if image not found or fails to load.
 */
import React, { useState } from 'react';
import CardPixelIcon from './CardPixelIcon';

// Eagerly import all artifact images via Vite's glob import
const imageModules = import.meta.glob('../../assets/artifacts/*.png', { eager: true, query: '?url', import: 'default' });

// Build lookup: cardId → image URL
const artifactImages = {};
for (const [path, url] of Object.entries(imageModules)) {
  const match = path.match(/\/([^/]+)\.png$/);
  if (match) artifactImages[match[1]] = url;
}

export default function ArtifactImage({ cardId, size = 28, color = '#A8A29E', glowColor, className = '' }) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = artifactImages[cardId];

  if (!imgUrl || imgError) {
    return <CardPixelIcon cardId={cardId} size={size} color={color} glowColor={glowColor} />;
  }

  return (
    <img
      src={imgUrl}
      alt=""
      width={size}
      height={size}
      className={className}
      onError={() => setImgError(true)}
      style={{
        objectFit: 'cover',
        borderRadius: '50%',
        display: 'block',
      }}
    />
  );
}
