import { ResidentialNodeCategories } from "./types";

export function generateUUID(): string {
    // A simple polyfill for generating UUIDs without `crypto`
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }


export function toggleDropdown(dropdown: HTMLDivElement | null, targetState?: string): void {
  if (!dropdown) return; // Exit if the ref is null
  
  // Check if the data-type attribute is 'dropdown'
  if (dropdown.getAttribute('data-type') === 'dropdown') {
    switch (targetState){
      case 'visible':
        dropdown.setAttribute('data-state', 'visible');
        dropdown.classList.remove('hidden');
        break;

      case 'hidden':
        dropdown.setAttribute('data-state', 'hidden');
        dropdown.classList.add('hidden');
        break;
        
      default:
        // Toggle visibility based on the current data-state
        const currentState = dropdown.getAttribute('data-state');
        if (currentState === 'hidden') {
          dropdown.setAttribute('data-state', 'visible');
          // dropdown.style.display = 'block';
          dropdown.classList.remove('hidden');
        } else if (currentState === 'visible') {
          dropdown.setAttribute('data-state', 'hidden');
          // dropdown.style.display = 'none';
          dropdown.classList.add('hidden');
        }
        break;
    }
  }
}


// Function to generate a random background color
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

export const widthToHeightRatio = 4/3;
export const UIHeight = 600;
export const UIWidth = widthToHeightRatio*UIHeight;
export const pixelToMM= 0.2645;

export const teamMembers = [
  'Jovin',
  'Bob',
  'Chris',
  'Valent',
  'Yee Lin',
  'Yi Show'
]