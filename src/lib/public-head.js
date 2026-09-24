export function publicHead(title, description, path) {
  const url = `https://vedantix.nl${path}`;
  return { meta: [{title}, {name:"description",content:description}, {property:"og:title",content:title}, {property:"og:description",content:description}, {property:"og:url",content:url}, {property:"og:type",content:"website"}, {property:"og:image",content:"https://vedantix.nl/preview.png"}, {name:"twitter:card",content:"summary_large_image"}, {name:"twitter:title",content:title}, {name:"twitter:description",content:description}] };
}
