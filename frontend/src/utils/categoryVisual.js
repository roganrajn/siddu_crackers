export function getCategoryVisualStyle(category) {
  const color = category?.color || '#7D3C5E';
  const gradient = `linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 60%, white))`;

  if (category?.banner_image) {
    return {
      backgroundImage: `url(${category.banner_image}), ${gradient}`,
      backgroundSize: 'cover, cover',
      backgroundPosition: 'center, center',
    };
  }

  return { backgroundImage: gradient };
}
