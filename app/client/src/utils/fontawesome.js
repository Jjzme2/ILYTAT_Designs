/**
 * Font Awesome Configuration
 * 
 * This module configures Font Awesome icons for the application.
 * It imports only the specific icons we need to keep bundle size small.
 * 
 * @module utils/fontawesome
 */
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Import the specific brand icons we need for social media
import { 
  faFacebookF, 
  faTiktok, 
  faInstagram, 
  faTwitter, 
  faPinterestP, 
  faYoutube 
} from '@fortawesome/free-brands-svg-icons';

// Import the specific solid icons we need for UI elements
import { 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faBars, 
  faTimes, 
  faShoppingCart 
} from '@fortawesome/free-solid-svg-icons';

// Add all icons to the library
library.add(
  // Brand icons for social media
  faFacebookF, 
  faTiktok, 
  faInstagram, 
  faTwitter, 
  faPinterestP, 
  faYoutube,
  
  // Solid icons for UI elements
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faBars, 
  faTimes, 
  faShoppingCart
);

/**
 * Register FontAwesome with Vue application
 * @param {Vue} app - Vue application instance
 */
export function registerFontAwesome(app) {
  app.component('font-awesome-icon', FontAwesomeIcon);
}
